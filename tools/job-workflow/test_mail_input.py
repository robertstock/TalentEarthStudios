import importlib.util
from email.message import EmailMessage
from pathlib import Path
import unittest
spec=importlib.util.spec_from_file_location('mail_input',Path(__file__).with_name('mail_input.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class MailTests(unittest.TestCase):
 def message(self,subject,attachment=True):
  e=EmailMessage();e['Subject']=subject;e['Message-ID']='<fixture@example.invalid>';e.set_content('Vendor invoice')
  if attachment:e.add_attachment(b'%PDF-1.7 original\r\n',maintype='application',subtype='pdf',filename='invoice.pdf')
  return e.as_bytes()
 def test_original_and_fullnumber(self):
  raw=self.message('Bill TE_2026_10_02_001');out=m.prepare_email(raw,lambda _: 'Vendor PDF',lambda _: {'currency':'USD'})
  self.assertEqual(out[0]['original'],b'%PDF-1.7 original\r\n');self.assertEqual(out[0]['metadata']['details'],{'currency':'USD'})
 def test_48139_no_name_guess(self):
  with self.assertRaises(m.ReviewRequired):m.prepare_email(self.message('K&L 48139 Actors Gang'),lambda _:'PO Actors Gang9-25 $54',lambda _:{})
 def test_payment_link_and_conflicting_numbers(self):
  with self.assertRaises(m.ReviewRequired):m.prepare_email(self.message('TE_2026_10_02_001',False),lambda _:'',lambda _:{})
  with self.assertRaises(m.ReviewRequired):m.prepare_email(self.message('TE_2026_10_02_001'),lambda _:'TE_2026_10_02_002',lambda _:{})
if __name__=='__main__':unittest.main()
