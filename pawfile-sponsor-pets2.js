document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const petId = params.get("petId");
  if (petId) {
    document.getElementById("petId").textContent = petId;
  }
});
