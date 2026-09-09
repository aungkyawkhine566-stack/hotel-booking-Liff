let calendar = null;

document.addEventListener("DOMContentLoaded", function () {
  initCalendar();
  fetchBookings();
});

function initCalendar() {
  const calendarEl = document.getElementById("calendar");
  if (!calendarEl) return;

  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,timeGridWeek",
    },
    events: [],
    eventClick: function (info) {
      alert(
        `Booking Details:\nCustomer: ${info.event.title}\nRoom: ${info.event.extendedProps.room}\nPhone: ${info.event.extendedProps.phone}`
      );
    },
  });

  calendar.render();
}

async function fetchBookings() {
  const listEl = document.getElementById("bookingList");
  if (listEl) listEl.innerHTML = "Loading bookings...";

  try {
    const response = await fetch(ADMIN_CONFIG.BOOKINGS_WEBHOOK, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();
    const bookings = Array.isArray(data) ? data : data.bookings || [];

    // Calendar အတွက် Event Format ပြောင်းလဲခြင်း
    const events = bookings.map((b) => ({
      id: b.booking_id || b.id,
      title: `${b.customer_name || "Guest"} (${b.room_name || b.room_id || "Room"})`,
      start: b.check_in || b.checkin,
      end: b.check_out || b.checkout, // Check-out date
      color: b.status === "Confirmed" ? "#28a745" : "#ffc107",
      extendedProps: {
        phone: b.phone || "-",
        room: b.room_name || b.room_id || "-",
      },
    }));

    // Calendar ထဲသို့ Events များ ထည့်သွင်းခြင်း
    if (calendar) {
      calendar.removeAllEvents();
      calendar.addEventSource(events);
    }

    // Table / List အဖြစ် အောက်တွင် ပြသခြင်း
    renderBookingList(bookings);
  } catch (error) {
    console.error("Error fetching admin bookings:", error);
    if (listEl) listEl.innerHTML = "<div class='error'>Failed to load bookings from server.</div>";
  }
}

function renderBookingList(bookings) {
  const listEl = document.getElementById("bookingList");
  if (!listEl) return;

  if (!bookings.length) {
    listEl.innerHTML = "No bookings found.";
    return;
  }

  listEl.innerHTML = `
    <table border="1" width="100%" style="border-collapse:collapse; text-align:left;">
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Phone</th>
          <th>Room</th>
          <th>Dates</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${bookings
          .map(
            (b) => `
          <tr>
            <td>${escapeHtml(b.booking_id || b.id || "-")}</td>
            <td>${escapeHtml(b.customer_name || "-")}</td>
            <td>${escapeHtml(b.phone || "-")}</td>
            <td>${escapeHtml(b.room_name || b.room_id || "-")}</td>
            <td>${escapeHtml(b.check_in || "")} → ${escapeHtml(b.check_out || "")}</td>
            <td>${escapeHtml(b.status || "Pending")}</td>
          </tr>`
          )
          .join("")}
      </tbody>
    </table>`;
}

function escapeHtml(v) {
  return String(v ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[m]));
}
