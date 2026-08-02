(() => {
  "use strict";

  const API_URL = "http://localhost:5000/api";
  const state = {
    membres: [],
    paiements: [],
    filtre: "all",
    membreId: null,
  };

  const dom = {
    form: document.getElementById("form-paiement"),
    membreSelect: document.getElementById("p-membre"),
    montantInput: document.getElementById("p-montant"),
    dateInput: document.getElementById("p-date"),
    referenceInput: document.getElementById("p-reference"),
    btnEnregistrer: document.getElementById("btn-enregistrer"),
    btnNouveauPaiement: document.getElementById("btn-nouveau-paiement"),
    btnImprimer: document.getElementById("btn-imprimer"),
    btnPdf: document.getElementById("btn-pdf"),
    messageGlobal: document.getElementById("message-global"),
    messageErreur: document.getElementById("message-erreur-paiement"),
    messageSucces: document.getElementById("message-succes-paiement"),
    alertePaiement: document.getElementById("alerte-paiement"),
    listePaiements: document.getElementById("liste-paiements"),
    memberAvatar: document.getElementById("member-avatar"),
    memberName: document.getElementById("member-name"),
    memberContact: document.getElementById("member-contact"),
    memberVillage: document.getElementById("member-village"),
    memberAdhesion: document.getElementById("member-adhesion"),
    memberTotalEarned: document.getElementById("member-total-earned"),
    memberTotalPaid: document.getElementById("member-total-paid"),
    memberBalance: document.getElementById("member-balance"),
    montantDu: document.getElementById("montant-du"),
    montantDejaPaye: document.getElementById("montant-deja-paye"),
    montantMaximum: document.getElementById("montant-maximum"),
    recuReference: document.getElementById("recu-reference"),
    recuMembre: document.getElementById("recu-membre"),
    recuMontant: document.getElementById("recu-montant"),
    recuDate: document.getElementById("recu-date"),
    recuMode: document.getElementById("recu-mode"),
    recuCommentaire: document.getElementById("recu-commentaire"),
    summaryMonth: document.getElementById("summary-month"),
    summaryCount: document.getElementById("summary-count"),
    summaryTotal: document.getElementById("summary-total"),
    summaryBalance: document.getElementById("summary-balance"),
    summaryToday: document.getElementById("summary-today"),
  };

  function money(value) {
    return `${Number(value || 0).toLocaleString("fr-FR")} FCFA`;
  }

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function formatDate(value) {
    if (!value) return "—";
    return new Date(`${value}T12:00:00`).toLocaleDateString("fr-FR");
  }

  function initials(name) {
    return String(name || "--")
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }

  function setFeedback(element, text, type = "") {
    element.textContent = text;
    element.hidden = !text;
    element.className = `message${type ? ` ${type}` : ""}`;
  }

  function setAlert(text) {
    dom.alertePaiement.hidden = !text;
    dom.alertePaiement.textContent = text;
  }

  function selectMode() {
    return document.querySelector('input[name="mode-paiement"]:checked')?.value || "";
  }

  function selectedMember() {
    return state.membres.find((membre) => String(membre.id) === String(state.membreId)) || null;
  }

  function memberPayments(memberId) {
    return state.paiements.filter((paiement) => String(paiement.membre_id) === String(memberId));
  }

  function calculateMemberTotals(member) {
    const totalPaye = memberPayments(member.id).reduce(
      (sum, paiement) => sum + Number(paiement.montant || 0),
      0
    );
    const soldeRestant = Number(member.solde || 0);
    const totalGagneFromMember = Number(member.total_gagne ?? member.total ?? 0);
    const totalGagne = Number.isFinite(totalGagneFromMember) && totalGagneFromMember > 0
      ? totalGagneFromMember
      : totalPaye + soldeRestant;

    return {
      totalPaye,
      soldeRestant,
      totalGagne,
    };
  }

  function validatePayment() {
    const member = selectedMember();
    const amount = Number(dom.montantInput.value || 0);
    const dateValue = dom.dateInput.value;

    if (!member) {
      return { valid: false, error: "Sélectionnez un membre avant d’enregistrer." };
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return { valid: false, error: "Le montant doit être supérieur à zéro." };
    }

    if (!dateValue) {
      return { valid: false, error: "La date du paiement est obligatoire." };
    }

    const paymentDate = new Date(`${dateValue}T12:00:00`);
    const now = new Date();
    if (paymentDate > now) {
      return { valid: false, error: "La date du paiement ne peut pas être dans le futur." };
    }

    if (member.date_adhesion) {
      const adhesionDate = new Date(`${member.date_adhesion}T12:00:00`);
      if (paymentDate < adhesionDate) {
        return { valid: false, error: "La date du paiement ne peut pas être antérieure à la date d’adhésion." };
      }
    }

    const soldeRestant = Number(member.solde || 0);
    if (amount > soldeRestant) {
      return {
        valid: false,
        error: `Paiement refusé : le maximum autorisé est ${money(soldeRestant)}.`,
      };
    }

    return { valid: true, error: "", member, amount, date: dateValue };
  }

  function updateMemberView(member) {
    if (!member) {
      [
        "member-total-earned",
        "member-total-paid",
        "member-balance",
        "montant-du",
        "montant-deja-paye",
        "montant-maximum",
      ].forEach((id) => {
        document.getElementById(id).textContent = "—";
      });
      dom.memberName.textContent = "Sélectionnez un membre";
      dom.memberAvatar.textContent = "--";
      dom.memberContact.textContent = "Ph: —";
      dom.memberVillage.textContent = "Village: —";
      dom.memberAdhesion.textContent = "Date de jointure: —";
      dom.recuMembre.textContent = "Sélectionnez un membre";
      return;
    }

    const totals = calculateMemberTotals(member);
    dom.memberAvatar.textContent = initials(member.nom);
    dom.memberName.textContent = member.nom;
    dom.memberContact.textContent = `Ph: ${member.contact || "—"}`;
    dom.memberVillage.textContent = `Village: ${member.village || "—"}`;
    dom.memberAdhesion.textContent = `Date de jointure: ${member.date_adhesion || "—"}`;
    dom.memberTotalEarned.textContent = money(totals.totalGagne);
    dom.memberTotalPaid.textContent = money(totals.totalPaye);
    dom.memberBalance.textContent = money(totals.soldeRestant);
    dom.montantDu.textContent = money(totals.totalGagne);
    dom.montantDejaPaye.textContent = money(totals.totalPaye);
    dom.montantMaximum.textContent = money(totals.soldeRestant);
    dom.recuMembre.textContent = member.nom;
    updatePaymentControl();
  }

  function updatePaymentControl() {
    const validation = validatePayment();
    const member = selectedMember();
    const amount = Number(dom.montantInput.value || 0);
    const due = Number(member?.solde || 0);

    dom.btnEnregistrer.disabled = !validation.valid;
    dom.recuMontant.textContent = amount > 0 ? money(amount) : "—";
    dom.recuDate.textContent = dom.dateInput.value ? formatDate(dom.dateInput.value) : "—";
    dom.recuMode.textContent = selectMode() || "—";
    dom.recuCommentaire.textContent = dom.referenceInput.value.trim() || "—";

    if (member && amount > 0 && amount > due) {
      setAlert(`Paiement refusé : le maximum autorisé est ${money(due)}.`);
    } else {
      setAlert("");
    }
  }

  function renderMembers() {
    const previousValue = state.membreId ? String(state.membreId) : "";
    dom.membreSelect.replaceChildren(new Option("-- Choisir un membre --", ""));

    state.membres.forEach((member) => {
      dom.membreSelect.add(
        new Option(`${member.nom} — solde ${money(Number(member.solde || 0))}`, member.id)
      );
    });

    if (previousValue) {
      dom.membreSelect.value = previousValue;
      state.membreId = previousValue;
      updateMemberView(selectedMember());
    }
  }

  function paymentDate(payment) {
    return new Date(`${payment.date}T12:00:00`);
  }

  function isVisible(payment) {
    if (state.filtre === "all") return true;
    const date = paymentDate(payment);
    const now = new Date();

    if (state.filtre === "today") return date.toDateString() === now.toDateString();

    if (state.filtre === "month") {
      return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    }

    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    return date >= start;
  }

  function updateReceipt(payment) {
    dom.recuReference.textContent = `AC-${payment.id}`;
    dom.recuMembre.textContent = payment.membre_nom || selectedMember()?.nom || "Inconnu";
    dom.recuMontant.textContent = money(payment.montant);
    dom.recuDate.textContent = payment.date ? formatDate(payment.date) : "—";
    dom.recuMode.textContent = payment.mode_paiement || "—";
    dom.recuCommentaire.textContent = payment.reference || payment.commentaire || "—";
  }

  function showReceipt(payment) {
    updateReceipt(payment);
    document.querySelector(".receipt-section").scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function printReceipt() {
    const receipt = document.querySelector(".receipt");
    if (!receipt || dom.recuReference.textContent === "—") {
      setFeedback(dom.messageGlobal, "Enregistrez ou sélectionnez un paiement avant d’imprimer le reçu.", "error");
      return;
    }

    receipt.classList.add("print-target");
    window.setTimeout(() => {
      window.print();
      receipt.classList.remove("print-target");
    }, 50);
  }

  function renderHistory() {
    dom.listePaiements.replaceChildren();
    const visible = state.paiements.filter(isVisible).sort((a, b) => paymentDate(b) - paymentDate(a));

    if (!visible.length) {
      const row = dom.listePaiements.insertRow();
      const cell = row.insertCell();
      cell.colSpan = 8;
      cell.textContent = "Aucun paiement pour cette période.";
      return;
    }

    visible.forEach((payment) => {
      const row = dom.listePaiements.insertRow();
      [
        `AC-${payment.id}`,
        payment.date,
        payment.membre_nom || "Inconnu",
        money(payment.montant),
        payment.mode_paiement || "—",
        "Agent",
      ].forEach((value) => {
        row.insertCell().textContent = value;
      });

      const statusCell = row.insertCell();
      const badge = document.createElement("span");
      badge.className = "badge badge-validated";
      badge.textContent = "Validé";
      statusCell.appendChild(badge);

      const actionCell = row.insertCell();
      const button = document.createElement("button");
      button.className = "table-action";
      button.type = "button";
      button.textContent = "Voir le reçu";
      button.addEventListener("click", () => showReceipt(payment));
      actionCell.appendChild(button);
    });
  }

  function renderSummary() {
    const total = state.paiements.reduce((sum, payment) => sum + Number(payment.montant || 0), 0);
    const month = new Date().toISOString().slice(0, 7);
    const monthTotal = state.paiements
      .filter((payment) => String(payment.date).startsWith(month))
      .reduce((sum, payment) => sum + Number(payment.montant || 0), 0);
    const balance = state.membres.reduce((sum, member) => sum + Number(member.solde || 0), 0);
    const todayCount = state.paiements.filter((payment) => payment.date === today()).length;

    dom.summaryCount.textContent = state.paiements.length;
    dom.summaryTotal.textContent = money(total);
    dom.summaryMonth.textContent = money(monthTotal);
    dom.summaryBalance.textContent = money(balance);
    dom.summaryToday.textContent = todayCount;
  }

  async function request(path, options = {}) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(`${API_URL}${path}`, { ...options, signal: controller.signal });
      let data;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(data?.erreur || data?.anomalies?.join(" ") || "Réponse API invalide.");
      }

      return data;
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error("Le serveur met trop de temps à répondre.");
      }
      if (error.message) {
        throw error;
      }
      throw new Error("Serveur inaccessible. Vérifiez que le backend est démarré.");
    } finally {
      window.clearTimeout(timeout);
    }
  }

  async function loadData() {
    try {
      const [membersResponse, paymentsResponse] = await Promise.all([
        request("/membres"),
        request("/paiements"),
      ]);

      state.membres = membersResponse.membres || [];
      state.paiements = paymentsResponse.paiements || [];
      renderMembers();
      renderHistory();
      renderSummary();
      updatePaymentControl();
      setFeedback(dom.messageGlobal, "", "");
    } catch (error) {
      setFeedback(dom.messageGlobal, `Impossible de charger les données : ${error.message}`, "error");
    }
  }

  async function submitPayment(event) {
    event.preventDefault();
    const validation = validatePayment();

    setFeedback(dom.messageErreur, "", "error");
    setFeedback(dom.messageSucces, "", "success");

    if (!validation.valid) {
      setFeedback(dom.messageErreur, validation.error, "error");
      return;
    }

    try {
      const result = await request("/paiements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          membre_id: Number(validation.member.id),
          montant: validation.amount,
          date: validation.date,
          mode_paiement: selectMode(),
          reference: dom.referenceInput.value.trim() || null,
        }),
      });

      const payment = {
        ...result.paiement,
        membre_nom: validation.member.nom,
        reference: dom.referenceInput.value.trim() || null,
      };

      state.paiements = [payment, ...state.paiements];
      updateReceipt(payment);
      setFeedback(
        dom.messageSucces,
        `${result.recu || "Paiement enregistré."} Nouveau solde : ${money(result.nouveau_solde)}.`,
        "success"
      );
      dom.form.reset();
      dom.dateInput.value = today();
      dom.membreSelect.value = "";
      state.membreId = null;
      updateMemberView(null);
      updatePaymentControl();
      await loadData();
    } catch (error) {
      setFeedback(dom.messageErreur, error.message, "error");
    }
  }

  function setup() {
    dom.dateInput.value = today();
    dom.dateInput.max = today();

    dom.membreSelect.addEventListener("change", () => {
      state.membreId = dom.membreSelect.value || null;
      updateMemberView(selectedMember());
    });

    [dom.montantInput, dom.dateInput, dom.referenceInput].forEach((element) => {
      element.addEventListener("input", updatePaymentControl);
    });

    document.querySelectorAll('input[name="mode-paiement"]').forEach((radio) => {
      radio.addEventListener("change", updatePaymentControl);
    });

    dom.form.addEventListener("submit", submitPayment);
    dom.btnNouveauPaiement.addEventListener("click", () => {
      dom.form.reset();
      dom.dateInput.value = today();
      dom.membreSelect.value = "";
      state.membreId = null;
      updateMemberView(null);
      updatePaymentControl();
      dom.membreSelect.focus();
    });

    dom.btnImprimer.addEventListener("click", printReceipt);
    dom.btnPdf.addEventListener("click", () => {
      if (dom.recuReference.textContent === "—") {
        setFeedback(dom.messageGlobal, "Enregistrez ou sélectionnez un paiement avant de télécharger le reçu.", "error");
        return;
      }
      setFeedback(dom.messageGlobal, "Dans la fenêtre d’impression, choisissez « Enregistrer au format PDF ».", "success");
      printReceipt();
    });

    document.querySelectorAll("[data-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        state.filtre = button.dataset.filter;
        document.querySelectorAll("[data-filter]").forEach((item) => {
          item.classList.toggle("active", item === button);
        });
        renderHistory();
      });
    });

    updatePaymentControl();
    loadData();
  }

  document.addEventListener("DOMContentLoaded", setup);
})();
