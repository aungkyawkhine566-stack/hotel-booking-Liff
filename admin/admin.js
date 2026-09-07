let bookings=[], current=new Date();
function api(){return (window.ADMIN_CONFIG&&ADMIN_CONFIG.BOOKINGS_WEBHOOK)||"https://YOUR-N8N-DOMAIN/webhook/cpark-admin-bookings";}
async function loadBookings(){try{const r=await fetch(api());const d=await r.json();bookings=d.bookings||d||[];render();}catch(e){document.getElementById("calendar").innerHTML="<div style='padding:20px'>Cannot load bookings. Configure admin webhook.</div>";}}
function changeMonth(n){current.setMonth(current.getMonth()+n);render();}
function render(){
 const y=current.getFullYear(),m=current.getMonth(); document.getElementById("monthTitle").textContent=current.toLocaleString("en",{month:"long",year:"numeric"});
 const first=new Date(y,m,1), start=(first.getDay()+6)%7, days=new Date(y,m+1,0).getDate();
 let h=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(x=>`<div class="head">${x}</div>`).join("");
 for(let i=0;i<start;i++)h+="<div class='day'></div>";
 for(let d=1;d<=days;d++){let ds=`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;let ev=bookings.filter(b=>b.check_in<=ds&&ds<b.check_out);
 h+=`<div class="day"><div class="num">${d}</div>${ev.map((b,i)=>`<div class="event" onclick='showDetail(${JSON.stringify(b).replace(/'/g,"&#39;")})'>${b.room_name||"Room"}<br>${b.customer_name||""}</div>`).join("")}</div>`;}
 document.getElementById("calendar").innerHTML=h;
}
function showDetail(b){const d=document.getElementById("detail");d.classList.remove("hidden");d.innerHTML=`<h3>${esc(b.room_name)}</h3><p><b>Booking ID:</b> ${esc(b.booking_id)}</p><p><b>Customer:</b> ${esc(b.customer_name)}</p><p><b>Phone:</b> ${esc(b.phone)}</p><p><b>Date:</b> ${esc(b.check_in)} → ${esc(b.check_out)}</p><p><b>Guests:</b> ${esc(b.guests)}</p><p><b>Status:</b> ${esc(b.status)}</p><p><b>Note:</b> ${esc(b.note||"-")}</p><button onclick="this.parentElement.classList.add('hidden')">Close</button>`;}
function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
render();loadBookings();
