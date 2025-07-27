document.addEventListener("DOMContentLoaded", () => {
  const editCard = document.getElementById("edit-card");
  const editContent = document.getElementById("edit-content");
  let currentEditId = null;

  document.querySelectorAll(".edit-btn, .more-link").forEach(btn => {
    btn.addEventListener("click", e => {
      e.preventDefault();
      currentEditId = btn.dataset.id;
      const card = document.querySelector(`.template-card[data-id="${currentEditId}"]`);
      const content = card.querySelector("p:nth-of-type(2)").innerText;
      editContent.value = content;
      editCard.classList.remove("hidden");
    });
  });

  document.getElementById("cancel-edit").addEventListener("click", () => {
    editCard.classList.add("hidden");
    editContent.value = "";
    currentEditId = null;
  });

  document.getElementById("save-template").addEventListener("click", async () => {
    if (!currentEditId) return;

    const newContent = editContent.value;

    const res = await fetch('/dashboard/templates/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id: currentEditId, content: newContent })
    });

    const result = await res.json();

    if (result.success) {
      const card = document.querySelector(`.template-card[data-id="${currentEditId}"]`);
      const lines = newContent.split('\n');
      card.querySelector("p:nth-of-type(1)").innerText = lines[0] || '';
      card.querySelector("p:nth-of-type(2)").innerText = lines[1] || '';
      alert("Template Saved!");
    } else {
      alert("Error saving template.");
    }

    editCard.classList.add("hidden");
    editContent.value = "";
    currentEditId = null;
  });
});
