
import { supabase } from "./supabase-client.js";

const tableBody = document.getElementById("bookingTableBody");
const searchInput = document.getElementById("bookingSearch");
const statusFilter = document.getElementById("statusFilter");

let bookings = [];

function showMessage(message) {
    tableBody.innerHTML = `
        <tr>
            <td colspan="7">
                <div class="empty-state">
                    <h3>${message}</h3>
                </div>
            </td>
        </tr>`;
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function updateStatistics() {
    document.getElementById("totalBookings").textContent = bookings.length;
    document.getElementById("pendingBookings").textContent =
        bookings.filter(b => b.status === "pending").length;
    document.getElementById("confirmedBookings").textContent =
        bookings.filter(b => b.status === "confirmed").length;
    document.getElementById("completedBookings").textContent =
        bookings.filter(b => b.status === "completed").length;
}

function renderBookings() {
    const search = searchInput.value.trim().toLowerCase();
    const filter = statusFilter.value;

    const filtered = bookings.filter(b => {
        const matchesSearch = [
            b.customer_name, b.phone, b.email, b.service
        ].some(value => String(value ?? "").toLowerCase().includes(search));

        const matchesStatus =
            filter === "all" ||
            b.status === filter ||
            (filter === "declined" && b.status === "cancelled");

        return matchesSearch && matchesStatus;
    });

    if (!filtered.length) {
        showMessage("No bookings match your search.");
        return;
    }

    tableBody.innerHTML = filtered.map(b => `
        <tr>
            <td>
                <strong>${escapeHTML(b.customer_name)}</strong><br>
                ${escapeHTML(b.phone)}
                ${b.email ? `<br>${escapeHTML(b.email)}` : ""}
                ${b.notes ? `<br><small>${escapeHTML(b.notes)}</small>` : ""}
            </td>
            <td>${escapeHTML(b.service)}</td>
            <td>${escapeHTML(b.booking_date)}</td>
            <td>${escapeHTML(String(b.booking_time).slice(0, 5))}</td>
            <td>KSh ${Number(b.price).toLocaleString("en-KE")}</td>
            <td>
                <span class="status ${b.status === "cancelled" ? "declined" : escapeHTML(b.status)}">
                    ${escapeHTML(b.status)}
                </span>
            </td>
            <td>
                ${b.status === "pending" ? `
                    <button data-id="${escapeHTML(b.id)}" data-status="confirmed">Confirm</button>
                    <button data-id="${escapeHTML(b.id)}" data-status="cancelled">Cancel</button>
                ` : ""}
                ${b.status === "confirmed" ? `
                    <button data-id="${escapeHTML(b.id)}" data-status="completed">Complete</button>
                    <button data-id="${escapeHTML(b.id)}" data-status="cancelled">Cancel</button>
                ` : ""}
            </td>
        </tr>
    `).join("");
}

async function loadBookings() {
    showMessage("Loading bookings...");

    const { data: { user }, error: authError } = await supabase.auth.getUser();

if (authError || !user) {
    window.location.replace("./admin-login.html");
    return;
}

const { data: admin, error: adminError } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

if (adminError || !admin) {
    await supabase.auth.signOut();
    window.location.replace("./admin-login.html");
    return;
}


    const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Loading bookings failed:", error);
        showMessage("Could not load bookings. Check admin access and database policies.");
        return;
    }

    bookings = data || [];
    updateStatistics();
    renderBookings();
}

tableBody.addEventListener("click", async event => {
    const button = event.target.closest("button[data-id][data-status]");
    if (!button) return;

    const { id, status } = button.dataset;
    const booking = bookings.find(b => b.id === id);

    if (!confirm(`Change this booking to "${status}"?`)) return;

    button.disabled = true;

    const { error } = await supabase
        .from("bookings")
        .update({ status })
        .eq("id", id);

    if (error) {
        console.error("Updating booking failed:", error);
        alert("Could not update booking. Check admin access and database policies.");
        button.disabled = false;
        return;
    }

   if ((status === "confirmed" || status === "cancelled") && booking) {
    const rawPhone = String(booking.phone).replace(/\D/g, "");

    const phone = rawPhone.startsWith("254")
        ? rawPhone
        : rawPhone.startsWith("0")
            ? "254" + rawPhone.slice(1)
            : "254" + rawPhone;

    const message = status === "confirmed"
        ? `Hello ${booking.customer_name}, your booking at White Gold Barbershop is CONFIRMED!\n\nService: ${booking.service}\nDate: ${booking.booking_date}\nTime: ${String(booking.booking_time).slice(0, 5)}\nPrice: KSh ${booking.price}\n\nWe look forward to serving you!`
        : `Hello ${booking.customer_name}, unfortunately your booking at White Gold Barbershop for ${booking.booking_date} at ${String(booking.booking_time).slice(0, 5)} has been CANCELLED.\n\nService: ${booking.service}\n\nPlease contact us on WhatsApp if you would like to arrange another appointment. We apologize for the inconvenience.`;

    window.open(
        `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
        "_blank"
    );
}

    await loadBookings();
});
searchInput.addEventListener("input", renderBookings);
statusFilter.addEventListener("change", renderBookings);

loadBookings();
