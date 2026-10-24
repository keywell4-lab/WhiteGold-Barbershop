import { supabase } from "./supabase-client.js";

document.addEventListener("DOMContentLoaded", function () {
    const bookingForm = document.getElementById("bookingForm");
    if (!bookingForm) return;

    const serviceSelect = document.getElementById("service");
    const dateInput = document.getElementById("appointmentDate");
    const priceOutput = document.getElementById("selectedPrice");
    const messageBox = document.getElementById("bookingMessage");
    const whatsappLink = document.getElementById("whatsappBooking");
    const submitButton = bookingForm.querySelector('button[type="submit"]');

    const whatsappNumber = "254117579587";

    function getLocalDateString(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    dateInput.min = getLocalDateString(new Date());

    function showMessage(text, type) {
        messageBox.textContent = text;
        messageBox.className = `booking-message visible ${type}`;
    }

    function updatePrice() {
        const option = serviceSelect.options[serviceSelect.selectedIndex];
        const price = option ? option.dataset.price : "";
        priceOutput.textContent = price
            ? `KSh ${Number(price).toLocaleString("en-KE")}`
            : "KSh 0";
    }

    function isSunday(dateString) {
        return new Date(`${dateString}T12:00:00`).getDay() === 0;
    }

    function formatDate(dateString) {
        return new Date(`${dateString}T12:00:00`).toLocaleDateString("en-KE", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    }

    function formatTime(timeString) {
        const [hour, minute] = timeString.split(":");
        const date = new Date();
        date.setHours(Number(hour), Number(minute), 0, 0);
        return date.toLocaleTimeString("en-KE", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true
        });
    }

    serviceSelect.addEventListener("change", updatePrice);

    dateInput.addEventListener("change", function () {
        if (dateInput.value && isSunday(dateInput.value)) {
            showMessage(
                "The barbershop is closed on Sundays. Please choose Monday to Saturday.",
                "error"
            );
            dateInput.value = "";
        } else {
            messageBox.className = "booking-message";
            messageBox.textContent = "";
        }
    });

    bookingForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        if (!bookingForm.reportValidity()) return;

        const customerName = document.getElementById("customerName").value.trim();
        const customerPhone = document.getElementById("customerPhone").value.trim();
        const customerEmail = document.getElementById("customerEmail").value.trim();
        const service = serviceSelect.value;
        const selectedOption = serviceSelect.options[serviceSelect.selectedIndex];
        const price = Number(selectedOption.dataset.price);
        const appointmentDate = dateInput.value;
        const appointmentTime = document.getElementById("appointmentTime").value;
        const paymentPreference = document.getElementById("paymentPreference").value;
        const customerNotes = document.getElementById("customerNotes").value.trim();

        if (customerPhone.replace(/\D/g, "").length < 9) {
            showMessage("Please enter a valid phone number.", "error");
            return;
        }

        if (isSunday(appointmentDate)) {
            showMessage("The barbershop is closed on Sundays.", "error");
            return;
        }

        const bookingDetails = [
            "Hello White Gold Barbershop, I would like to request an appointment.",
            "",
            `Name: ${customerName}`,
            `Phone: ${customerPhone}`,
            customerEmail ? `Email: ${customerEmail}` : "",
            `Service: ${service}`,
            `Price: KSh ${price.toLocaleString("en-KE")}`,
            `Preferred date: ${formatDate(appointmentDate)}`,
            `Preferred time: ${formatTime(appointmentTime)}`,
            `Payment preference: ${paymentPreference}`,
            customerNotes ? `Additional notes: ${customerNotes}` : "",
            "",
            "Please confirm whether this date and time are available."
        ].filter(Boolean).join("\n");

        const previousButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = "Saving booking...";

        try {
            const { error } = await supabase
                .from("bookings")
                .insert({
                    customer_name: customerName,
                    phone: customerPhone,
                    email: customerEmail || null,
                    service: service,
                    price: price,
                    booking_date: appointmentDate,
                    booking_time: appointmentTime,
                    payment_method: paymentPreference,
                    notes: customerNotes || null,
                    status: "pending"
                });

            if (error) throw error;

            whatsappLink.href =
                `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(bookingDetails)}`;

            showMessage(
                "Booking request saved successfully! Select “Ask on WhatsApp” to notify the barbershop. Your appointment is not confirmed until the shop replies.",
                "success"
            );

            whatsappLink.focus();
        } catch (error) {
            console.error("Booking save failed:", error);
            showMessage(
                `We couldn't save your booking. ${error.message || "Please try again."}`,
                "error"
            );
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = previousButtonText;
        }
    });

    updatePrice();
});