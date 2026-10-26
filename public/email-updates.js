(() => {
 const form = document.querySelector('#email-updates');
 if (!form) return;
 const status = document.querySelector('#signup-status');
 const button = form.querySelector('button[type=submit]');
 const topics = {
  luxury:{list:'Y9Yjy2',division:'luxury',label:'Luxury Advisory'},
  capital:{list:'VyesVT',division:'capital',label:'Capital Advisory'},
  property:{list:'WtKwMz',division:'realty',label:'Property Acquisitions'}
 };
 let busy = false;
 form.addEventListener('submit', async event => {
  event.preventDefault();
  if (busy || !form.reportValidity()) return;
  if (form.elements.website.value) return;
  const topic = topics[form.elements.topic.value];
  if (!topic || !form.elements.consent.checked) return;
  busy = true; button.disabled = true;
  status.textContent = 'Sending your confirmation request…';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  const payload = {data:{type:'subscription',attributes:{
   custom_source:'Quest Luxo ' + topic.label + ' website email updates — consent v1',
   profile:{data:{type:'profile',attributes:{
    email:form.elements.email.value.trim(),
    properties:{ql_signup_division:topic.division,ql_signup_source:location.origin + location.pathname,ql_consent_version:'2026-10-26-v1'},
    subscriptions:{email:{marketing:{consent:'SUBSCRIBED'}}}
   }}}
  },relationships:{list:{data:{type:'list',id:topic.list}}}}};
  try {
   const response = await fetch('https://a.klaviyo.com/client/subscriptions?company_id=WjLFUt', {
    method:'POST',headers:{'Content-Type':'application/vnd.api+json',accept:'application/vnd.api+json',revision:'2026-10-15'},
    body:JSON.stringify(payload),credentials:'omit',referrerPolicy:'no-referrer',signal:controller.signal
   });
   if (response.status !== 202) {
    status.textContent = response.status === 429 ? 'Too many requests. Please wait a few minutes before trying again.' : 'We could not submit your request. Check your email address and try again later.';
    return;
   }
   status.textContent = 'Request received. Check your inbox for a confirmation email from Quest Luxo. You will join the selected email list only after confirming. If you are already subscribed, you may not receive another confirmation.';
   form.reset();
  } catch (_) {
   status.textContent = 'We could not confirm whether your request was received. Check your inbox before trying again. You can contact denzel@questluxo.com for help.';
  } finally {clearTimeout(timer);busy=false;button.disabled=false;}
 });
})();