const { createClient } = supabase;
const supabaseClient = createClient(
  "https://pktxrjqiqrmflrjbexpb.supabase.co",
  "sb_publishable_8wgD-XJ9FnfHUIeY7to8LQ_P-1pTu1m"
);

const state = { lang: "ar", purpose: "general", amount: 0 };

const $ = (id) => document.getElementById(id);
const els = {
  step1:$("step1"), step2:$("step2"), step3:$("step3"),
  amount:$("amount"), summaryAmount:$("summaryAmount"), summaryPurpose:$("summaryPurpose"),
  receipt:$("receipt"), donorName:$("donorName"), contact:$("contact"), notes:$("notes")
};

function toast(msg){
  const t=document.createElement("div"); t.className="toast"; t.textContent=msg;
  document.body.appendChild(t); setTimeout(()=>t.remove(),2200);
}
function translate(){
  const ar=state.lang==="ar";
  document.documentElement.lang=state.lang;
  document.documentElement.dir=ar?"rtl":"ltr";
  document.querySelectorAll("[data-ar][data-en]").forEach(el=>{
    el.textContent = el.dataset[state.lang];
  });
  $("langBtn").textContent=ar?"English":"العربية";
  updateSummary();
}
$("langBtn").addEventListener("click",()=>{ state.lang=state.lang==="ar"?"en":"ar"; translate(); });

document.querySelectorAll(".purpose").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll(".purpose").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active"); state.purpose=btn.dataset.value;
  });
});
document.querySelectorAll(".quick-amounts button").forEach(btn=>{
  btn.addEventListener("click",()=>{ els.amount.value=Number(btn.dataset.amount).toFixed(3); });
});
function activePurposeButton(){
  return document.querySelector(`.purpose[data-value="${state.purpose}"]`);
}
function updateSummary(){
  const btn=activePurposeButton();
  els.summaryAmount.textContent=state.amount ? `${state.amount.toFixed(3)} BHD` : "—";
  els.summaryPurpose.textContent=btn ? btn.dataset[state.lang] : "—";
}
$("continueBtn").addEventListener("click",()=>{
  const amount=parseFloat(els.amount.value);
  if(!amount || amount<=0){
    toast(state.lang==="ar"?"يرجى إدخال مبلغ التبرع":"Please enter a donation amount"); return;
  }
  state.amount=amount; updateSummary();
  els.step1.classList.remove("active-step"); els.step2.classList.add("active-step");
  window.scrollTo({top:0,behavior:"smooth"});
});
$("backBtn").addEventListener("click",()=>{
  els.step2.classList.remove("active-step"); els.step1.classList.add("active-step");
});
$("copyIban").addEventListener("click", async ()=>{
  const iban=$("iban").textContent.trim();
  try{ await navigator.clipboard.writeText(iban); }
  catch(e){
    const ta=document.createElement("textarea"); ta.value=iban; document.body.appendChild(ta);
    ta.select(); document.execCommand("copy"); ta.remove();
  }
  toast(state.lang==="ar"?"تم نسخ الآيبان":"IBAN copied");
});

function sanitizeFileName(name){
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

$("submitBtn").addEventListener("click", async ()=>{
  if(!els.receipt.files.length){
    toast(state.lang==="ar"?"يرجى اختيار صورة الإيصال":"Please select the receipt image"); return;
  }

  const submitBtn = $("submitBtn");
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = state.lang==="ar" ? "جارٍ الإرسال..." : "Submitting...";

  const file = els.receipt.files[0];
  const ref="DAQ-"+new Date().toISOString().slice(0,10).replaceAll("-","")+"-"+Math.random().toString(36).slice(2,7).toUpperCase();
  const receiptPath = `${ref}/${Date.now()}-${sanitizeFileName(file.name)}`;

  try {
    const { error: uploadError } = await supabaseClient.storage
      .from("donation-receipts")
      .upload(receiptPath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || undefined
      });

    if (uploadError) throw uploadError;

    const { error: insertError } = await supabaseClient
      .from("donations")
      .insert([{
        reference_number: ref,
        donor_name: els.donorName.value.trim() || null,
        contact_number: els.contact.value.trim() || null,
        amount: Number(state.amount.toFixed(3)),
        donation_purpose: state.purpose,
        receipt_path: receiptPath,
        status: "pending",
        notes: els.notes.value.trim() || null
      }]);

    if (insertError) {
      await supabaseClient.storage.from("donation-receipts").remove([receiptPath]);
      throw insertError;
    }

    $("referenceBox").textContent=(state.lang==="ar"?"رقم المرجع: ":"Reference: ")+ref;
    els.step2.classList.remove("active-step"); els.step3.classList.add("active-step");
    window.scrollTo({top:0,behavior:"smooth"});
  } catch (err) {
    console.error(err);
    toast(state.lang==="ar"
      ?"تعذر إرسال التبرع الآن. يرجى المحاولة مرة أخرى."
      :"We couldn't submit the donation right now. Please try again.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
});
$("doneBtn").addEventListener("click",()=>location.reload());
translate();
