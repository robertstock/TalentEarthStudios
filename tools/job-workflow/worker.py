"""Local filesystem half of a claimed job task. No credentials, Mail UI or scheduler.
Only call after server claim proves current approval. Backend is injected by owner setup.
"""
import hashlib
import json
import os
import re
import stat
import tempfile
from pathlib import Path

PRODUCTION_PARENT = Path('/Users/stockfamily/Desktop/****WIP/****In_Production')

class ReviewRequired(Exception):
    pass

def _folder(parent, name):
    if not name or name in ('.', '..') or '/' in name or '\0' in name:
        raise ReviewRequired('Invalid single folder name')
    try:
        os.mkdir(name, dir_fd=parent)
    except FileExistsError:
        pass
    return os.open(name, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=parent)

def _read(fd, name):
    try:
        item = os.open(name, os.O_RDONLY | os.O_NOFOLLOW, dir_fd=fd)
    except FileNotFoundError:
        return None
    with os.fdopen(item, 'rb') as f:
        if not stat.S_ISREG(os.fstat(f.fileno()).st_mode) or os.fstat(f.fileno()).st_size > 4*1024*1024:
            raise ReviewRequired('Existing path is not a regular file')
        return f.read()

def _publish(fd, name, content):
    """Hard-link publication cannot overwrite an existing filename, even after a crash."""
    prior = _read(fd, name)
    if prior is not None:
        if prior != content:
            raise ReviewRequired('Filename exists with different contents')
        return 'reused'
    temporary = '.finley-' + os.urandom(16).hex()
    handle = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600, dir_fd=fd)
    try:
        with os.fdopen(handle, 'wb') as f:
            f.write(content)
            f.flush()
            os.fsync(f.fileno())
        try:
            os.link(temporary, name, src_dir_fd=fd, dst_dir_fd=fd, follow_symlinks=False)
        except FileExistsError:
            if _read(fd, name) != content:
                raise ReviewRequired('Concurrent filename conflict')
        os.fsync(fd)
        return 'saved'
    finally:
        os.unlink(temporary, dir_fd=fd)

def _root(path):
    # Check each component; never traverse a replacement symlink.
    fd = os.open('/', os.O_RDONLY | os.O_DIRECTORY)
    try:
        for name in Path(path).parts[1:]:
            child = os.open(name, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=fd)
            os.close(fd)
            fd = child
        return fd
    except BaseException:
        os.close(fd)
        raise

def ensure_folder(payload, parent=PRODUCTION_PARENT):
    name, number = payload['folderName'], payload['jobNumber']
    if not re.fullmatch(r'TE_\d{4}_\d{2}_\d{2}_[0-9]{3,}', number) or not name.endswith(' — ' + number):
        raise ReviewRequired('Folder does not contain the full job number')
    if '/' in name or ':' in name or '\0' in name or len(name.encode()) > 255:
        raise ReviewRequired('Invalid approved folder name')
    marker = json.dumps({'projectId': payload['projectId'], 'jobNumber': number}, sort_keys=True).encode()
    root = _root(parent)
    folder = None
    try:
        try:
            os.mkdir(name, dir_fd=root)
            created = True
        except FileExistsError:
            created = False
        folder = os.open(name, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=root)
        existing = _read(folder, '.finley-job.json')
        if not created and existing != marker:
            raise ReviewRequired('Existing folder has no matching job association; reconcile before reuse')
        _publish(folder, '.finley-job.json', marker)
        for child in ('Outside Costs', 'Artwork'):
            os.close(_folder(folder, child))
        os.fsync(folder)
        return str(Path(parent) / name)
    finally:
        if folder is not None:
            os.close(folder)
        os.close(root)

def copy_invoice(payload, content, parent=PRODUCTION_PARENT):
    if hashlib.sha256(content).hexdigest() != payload['sha256']:
        raise ReviewRequired('Attachment hash mismatch')
    name = re.sub(r'[/\x00:]', '_', payload['fileName'])
    if not name or name in ('.', '..') or len(name.encode()) > 255:
        raise ReviewRequired('Invalid attachment filename')
    # Revalidates marker and exact approved folder identity on each retry.
    path = ensure_folder(payload, parent)
    folder = _root(Path(path) / 'Outside Costs')
    try:
        result = _publish(folder, name, content)
        return {'path': str(Path(path) / 'Outside Costs' / name), 'result': result, 'sha256': payload['sha256']}
    finally:
        os.close(folder)

def run_claimed(task, backend, parent=PRODUCTION_PARENT):
    """No network implementation until owner-approved restricted authentication exists."""
    if task['state'] != 'RUNNING' or not task.get('leaseToken'):
        raise ReviewRequired('Server claim required before local work')
    try:
        if task['kind'] == 'FOLDER':
            result = {'path': ensure_folder(task['payload'], parent)}
        elif task['kind'] == 'INVOICE_COPY':
            result = copy_invoice(task['payload'], backend.original(task['id']), parent)
        else:
            raise ReviewRequired('Unsupported task capability')
    except Exception as exc:
        backend.fail(task['id'], task['leaseToken'], str(exc))
        raise
    # An ACK failure never reruns the external operation here; retry reuses byte-identical files.
    return backend.complete(task['id'], task['leaseToken'], result)
