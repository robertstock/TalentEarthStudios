from dataclasses import asdict
import copy
from email.message import EmailMessage
import hashlib
import tempfile
from pathlib import Path
import unittest

from kl_intake import ACCOUNT, Invoice, ReviewRequired, VENDOR, parse_email, prepare, save_pdf, import_website_cost

PDF = b"%PDF-1.7\nfixture only\n%%EOF"
TEXT = '''K&L WIDE FORMAT DIGITAL PRINTING
TalentEarth, Inc.
INVOICE # DATE TOTAL DUE DUE DATE TERMS
48139 09/29/2026 $54.00 09/29/2026 Due on receipt
P.O. NUMBER
Actors Gang 9-25
Banner:Banner
SUBTOTAL 54.00
TAX 0.00
TOTAL 54.00
BALANCE DUE $54.00'''

def message(pdf=PDF, sender=VENDOR + ' <quickbooks@notification.intuit.com>'):
    msg = EmailMessage()
    msg['From'] = sender
    msg['To'] = ACCOUNT
    msg['Subject'] = 'New payment request - invoice 48139'
    msg['Message-ID'] = '<same-message@example.test>'
    msg.set_content('View and pay. Balance due $54.00')
    if pdf:
        msg.add_attachment(pdf, maintype='application', subtype='pdf', filename='../../untrusted.pdf')
    return msg.as_bytes()

def parsed():
    return parse_email(message(), lambda _: TEXT, ACCOUNT)[0]

def jobs():
    return [{'id': 'fixture-job', 'references': ['Actors Gang 9-25'], 'status': 'ACTIVE',
             'clientAccepted': True, 'vendorAssigned': True, 'snapshotComplete': True,
             'wipPath': '*ToBill/Actors_Gang_PYOB', 'costFolder': '**Outside_Costs',
             'documents': [], 'costs': []}]

class IntakeTests(unittest.TestCase):
    def test_verified_template_and_shared_sender_filter(self):
        inv = parsed()
        self.assertEqual((inv.total_cents, inv.invoice_number, inv.reference), (5400, '48139', 'Actors Gang 9-25'))
        for data, text in [(message(sender='Other Vendor <quickbooks@notification.intuit.com>'), TEXT),
                           (message(pdf=None), TEXT), (message(), TEXT.replace('TOTAL 54.00', 'TOTAL 55.00')),
                           (message(), TEXT.replace('TAX 0.00', 'TAX 1.00'))]:
            with self.assertRaises(ReviewRequired):
                parse_email(data, lambda _: text, ACCOUNT)

    def test_ambiguous_jobs_and_unaccepted_jobs_stop(self):
        for snapshot in [[], jobs() + jobs(), [{**jobs()[0], 'clientAccepted': False}],
                         [{**jobs()[0], 'snapshotComplete': False}]]:
            with self.assertRaises(ReviewRequired):
                prepare(parsed(), snapshot)

    def test_manual_cost_and_invoice_conflicts_stop(self):
        snapshot = jobs()
        snapshot[0]['costs'] = [{'amount': 54, 'date': '2026-09-29', 'vendorName': 'Printing'}]
        with self.assertRaises(ReviewRequired):
            prepare(parsed(), snapshot)
        snapshot = jobs()
        snapshot[0]['documents'] = [{'id': 'doc', 'status': 'DRAFT', 'sha256': 'different', 'details': parsed().details()}]
        with self.assertRaises(ReviewRequired):
            prepare(parsed(), snapshot)
        with self.assertRaises(ReviewRequired):
            prepare(parsed(), jobs(), [{'messageId': parsed().message_id, 'sha256': 'different', 'projectId': 'fixture-job'}])

    def test_save_is_no_clobber_and_reuses_existing(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            job = root / '*ToBill/Actors_Gang_PYOB'
            job.mkdir(parents=True)
            plan = {"wipPath": "*ToBill/Actors_Gang_PYOB", "costFolder": "**Outside_Costs", "invoice": asdict(parsed())}
            result = save_pdf(plan, PDF, root, allow_create=True)
            self.assertEqual(result['action'], 'saved')
            self.assertEqual(save_pdf(plan, PDF, root)['action'], 'reuse')
            path = job / '**Outside_Costs' / result['fileName']
            extra = path.with_name("copy_48139.pdf")
            extra.write_bytes(b"%PDF-conflict")
            with self.assertRaises(ReviewRequired):
                save_pdf(plan, PDF, root)
            extra.unlink()
            path.write_bytes(b'%PDF-conflict')
            with self.assertRaises(ReviewRequired):
                save_pdf(plan, PDF, root, allow_create=True)
            self.assertEqual(path.read_bytes(), b'%PDF-conflict')

    def test_symlink_and_traversal_are_rejected(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            (root / 'escape').symlink_to('/tmp', target_is_directory=True)
            plan = {"wipPath": "*ToBill/Actors_Gang_PYOB", "costFolder": "**Outside_Costs", "invoice": asdict(parsed())}
            for path in ['../outside', '/tmp', 'escape']:
                plan['wipPath'] = path
                with self.assertRaises((ReviewRequired, OSError)):
                    save_pdf(plan, PDF, root, allow_create=True)

    def test_legacy_name_mapping_cannot_import(self):
        class FakeBackend:
            def fresh_jobs(self): return jobs()
            def upload(self, *args): raise AssertionError("Legacy import must not upload")
            def approve(self, *args): raise AssertionError("Legacy import must not approve")
        with self.assertRaisesRegex(ReviewRequired, "Legacy PO/name matching is retired"):
            import_website_cost(parsed(), PDF, FakeBackend(), 'fixture-job')

if __name__ == '__main__':
    unittest.main()
