import hashlib
import importlib.util
import tempfile
import unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('worker',Path(__file__).with_name('worker.py'))
w=importlib.util.module_from_spec(spec);spec.loader.exec_module(w)
class WorkerTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name).resolve()
  self.p={'projectId':'fixture','jobNumber':'TE_2026_10_02_001','folderName':'Banner — TE_2026_10_02_001'}
 def tearDown(self):self.tmp.cleanup()
 def test_replay_folder_and_file(self):
  path=Path(w.ensure_folder(self.p,self.root));self.assertEqual(w.ensure_folder(self.p,self.root),str(path))
  self.assertTrue((path/'Artwork').is_dir());self.assertTrue((path/'Outside Costs').is_dir())
  raw=b'%PDF-1.7\r\nOriginal bytes\x00';p={**self.p,'fileName':'original.pdf','sha256':hashlib.sha256(raw).hexdigest()}
  self.assertEqual(w.copy_invoice(p,raw,self.root)['result'],'saved')
  self.assertEqual(w.copy_invoice(p,raw,self.root)['result'],'reused')
  self.assertEqual((path/'Outside Costs/original.pdf').read_bytes(),raw)
 def test_unassociated_existing_folder(self):
  (self.root/self.p['folderName']).mkdir()
  with self.assertRaises(w.ReviewRequired):w.ensure_folder(self.p,self.root)
 def test_conflict_and_symlink(self):
  path=Path(w.ensure_folder(self.p,self.root));(path/'Outside Costs/x.pdf').write_bytes(b'old')
  with self.assertRaises(w.ReviewRequired):w.copy_invoice({**self.p,'fileName':'x.pdf','sha256':hashlib.sha256(b'new').hexdigest()},b'new',self.root)
  self.assertEqual((path/'Outside Costs/x.pdf').read_bytes(),b'old')
  (path/'Outside Costs/link.pdf').symlink_to(path/'Outside Costs/x.pdf')
  with self.assertRaises(OSError):w.copy_invoice({**self.p,'fileName':'link.pdf','sha256':hashlib.sha256(b'old').hexdigest()},b'old',self.root)
 def test_partial_subfolder_recovery(self):
  path=Path(w.ensure_folder(self.p,self.root));(path/'Artwork').rmdir()
  w.ensure_folder(self.p,self.root);self.assertTrue((path/'Artwork').is_dir())
 def test_mismatched_job_marker(self):
  w.ensure_folder(self.p,self.root)
  with self.assertRaises(w.ReviewRequired):w.ensure_folder({**self.p,'projectId':'different'},self.root)
if __name__=='__main__':unittest.main()
