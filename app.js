let profile = null;
let selectedRoom = null;
let rooms = [];

function $(id){ return document.getElementById(id); }

async function init(){
  try{
    if(CONFIG.LIFF_ID && CONFIG.LIFF_ID !== "YOUR_LIFF_ID"){
      await liff.init({liffId: CONFIG.LIFF_ID});
      if(liff.isLoggedIn()){
        profile = await liff.getProfile();
      }else{
        liff.login();
        return;
      }
    }
  }catch(e){ console.error(e); }
  setDateLimits();
}
init();

function setDateLimits(){
  const today = new Date();
  const iso = today.toISOString().split("T")[0];
  $("checkin").min = iso;
  $("checkout").min = iso;
  $("checkin").addEventListener("change",()=>{
    $("checkout").min = $("checkin").value;
    if($("checkout").value && $("checkout").value <= $("checkin").value) $("checkout").value="";
  });
}

function showPage(id){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  $(id).classList.add("active");
  window.scrollTo(0,0);
}

function closeLiff(){ if(window.liff && liff.isInClient()) liff.closeWindow(); }

function getUserId(){ return profile?.userId || "WEB_TEST_USER"; }

async function searchRooms(){
  const checkin=$("checkin").value, checkout=$("checkout").value, guests=Number($("guests").value);
  if(!checkin || !checkout || checkout<=checkin){ alert("Please select valid check-in and check-out dates."); return; }

  $("rooms").innerHTML="<div class='card'>Searching...</div>";
  try{
    const r=await fetch(CONFIG.SEARCH_WEBHOOK,{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({checkin,checkout,guests})});
    const data=await r.json();
    rooms=data.rooms || data || [];
    if(!Array.isArray(rooms)) rooms=[];
    renderRooms();
  }catch(e){
    $("rooms").innerHTML="<div class='error'>Unable to search rooms. Check the n8n webhook URL.</div>";
  }
}

function renderRooms(){
  if(!rooms.length){$("rooms").innerHTML="<div class='card'>No available rooms for these dates.</div>";return;}
  $("rooms").innerHTML=rooms.map((r,i)=>`
    <div class="room-card">
      <img class="room-img" src="${escapeHtml(r.image_url||r.imageUrl||'https://via.placeholder.com/120x90?text=Room')}" onerror="this.src='https://via.placeholder.com/120x90?text=Room'">
      <div class="grow"><b>${escapeHtml(r.room_name||r.roomName||'Room')}</b><div class="muted">${escapeHtml(r.room_type||r.roomType||'')}</div><div class="price">${Number(r.price_per_night||r.price||0).toLocaleString()} MMK / night</div></div>
      <button class="select-btn" onclick="selectRoom(${i})">Select</button>
    </div>`).join("");
}

function selectRoom(i){
  selectedRoom=rooms[i];
  $("selectedRoomBox").innerHTML=`<div class="booking-item"><b>${escapeHtml(selectedRoom.room_name||selectedRoom.roomName)}</b><div class="price">${Number(selectedRoom.price_per_night||selectedRoom.price||0).toLocaleString()} MMK / night</div><div class="muted">${$("checkin").value} → ${$("checkout").value}</div></div>`;
  showPage("infoPage");
}

function showConfirm(){
  if(!$("customerName").value.trim() || !$("phone").value.trim()){alert("Please enter your name and phone number.");return;}
  $("confirmBox").innerHTML=`
    <b>${escapeHtml(selectedRoom.room_name||selectedRoom.roomName)}</b>
    <p><b>Date:</b> ${$("checkin").value} → ${$("checkout").value}</p>
    <p><b>Guests:</b> ${$("guests").value}</p>
    <p><b>Name:</b> ${escapeHtml($("customerName").value)}</p>
    <p><b>Phone:</b> ${escapeHtml($("phone").value)}</p>
    <p><b>Note:</b> ${escapeHtml($("note").value||"-")}</p>`;
  showPage("confirmPage");
}

async function createBooking(){
  if(!selectedRoom)return;
  const payload={
    user_id:getUserId(),
    customer_name:$("customerName").value.trim(),
    phone:$("phone").value.trim(),
    room_id:selectedRoom.room_id||selectedRoom.roomId,
    room_name:selectedRoom.room_name||selectedRoom.roomName,
    check_in:$("checkin").value,
    check_out:$("checkout").value,
    guests:Number($("guests").value),
    note:$("note").value.trim()
  };
  try{
    const r=await fetch(CONFIG.BOOKING_WEBHOOK,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    const data=await r.json();
    if(!data.success){alert(data.message||"Booking failed.");return;}
    $("bookingIdResult").innerHTML=`<p><b>Booking ID: ${escapeHtml(data.booking_id||"")}</b></p><p class="muted">Please wait for confirmation.</p>`;
    showPage("successPage");
  }catch(e){alert("Booking failed. Please check n8n.");}
}

async function loadBookings(){
  $("myBookings").innerHTML="<div class='card'>Loading...</div>";
  try{
    const r=await fetch(CONFIG.MY_BOOKINGS_WEBHOOK,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({user_id:getUserId()})});
    const data=await r.json(); const list=data.bookings||[];
    $("myBookings").innerHTML=list.length?list.map(b=>`
      <div class="booking-item"><b>${escapeHtml(b.room_name||"Room")}</b>
      <div>${escapeHtml(b.check_in)} → ${escapeHtml(b.check_out)}</div>
      <div>Guests: ${escapeHtml(String(b.guests||""))}</div>
      <p><span class="status">${escapeHtml(b.status||"Pending")}</span></p>
      <div class="muted">Booking ID: ${escapeHtml(b.booking_id||"")}</div></div>`).join(""):"<div class='card'>No bookings found.</div>";
  }catch(e){$("myBookings").innerHTML="<div class='error'>Could not load bookings.</div>";}
}

function loadProfile(){
  $("profile").innerHTML=profile?`<p><b>Name:</b> ${escapeHtml(profile.displayName)}</p><p><b>LINE User ID:</b> ${escapeHtml(profile.userId)}</p>`:"<p>Profile is available after LINE login.</p>";
}
function escapeHtml(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
