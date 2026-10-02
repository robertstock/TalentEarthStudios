"""Bounded EML preparation for all vendors. Caller supplies reviewed extraction.
Reading exported EML bytes cannot alter Apple Mail's read status. No sender allowlist:
shared QuickBooks sender addresses do not establish supplier identity.
"""
import email
import email.policy
import hashlib
import re

class ReviewRequired(Exception):pass

def prepare_email(raw, extract_pdf_text, extract_details):
 if len(raw)>12*1024*1024:raise ReviewRequired('Message exceeds intake limit')
 message=email.message_from_bytes(raw,policy=email.policy.default)
 message_id=str(message.get('Message-ID','')).strip()
 if not message_id:raise ReviewRequired('Missing Message-ID; reconcile source before import')
 bodies=[];attachments=[]
 for part in message.walk():
  if part.is_multipart():continue
  content=part.get_payload(decode=True) or b''
  if part.get_content_disposition()=='attachment' or part.get_filename():
   if not content.startswith(b'%PDF-'):raise ReviewRequired('Unsupported or unreadable attachment needs review')
   if len(content)>4*1024*1024:raise ReviewRequired('Attachment exceeds 4 MB')
   attachments.append((part.get_filename() or 'invoice.pdf',content))
  elif part.get_content_type() in ('text/plain','text/html'):
   bodies.append(content.decode(part.get_content_charset() or 'utf-8',errors='replace'))
 if not attachments:raise ReviewRequired('No original invoice attachment; a payment link is not an invoice file')
 results=[]
 for filename,content in attachments:
  text=extract_pdf_text(content)
  evidence=[str(message.get('Subject','')),*bodies,filename,text]
  numbers=set(re.findall(r'(?<![A-Za-z0-9_])TE_\d{4}_\d{2}_\d{2}_\d{3,}(?![A-Za-z0-9_])','\n'.join(evidence),re.I))
  if len({n.upper() for n in numbers})!=1:raise ReviewRequired('Exactly one full TE job number required; no client/name/PO guessing')
  results.append({'metadata':{'messageId':message_id,'fileName':filename,'evidence':evidence,'details':extract_details(content)},'original':content,'sha256':hashlib.sha256(content).hexdigest()})
 return results
