(() => {
  'use strict';

  const API_URL = 'http://localhost:5000/api';
  const state = { membres: [], paiements: [], filtre: 'all', membreId: null };
  const $ = (id) => document.getElementById(id);
  const money = (value) => `${Number(value || 0).toLocaleString('fr-FR')} FCFA`;
  const today = () => new Date().toISOString().slice(0, 10);
  const initials = (name) => String(name || '--').split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();

  function loadSession() {
    const sessionText = localStorage.getItem('agricoop_utilisateur');
    let session = null;
    try { session = sessionText ? JSON.parse(sessionText) : null; } catch { session = null; }
    const name = session?.nom_complet || session?.nom || '';
    const role = session?.role ? ` (${session.role})` : '';
    $('avatar-utilisateur').textContent = initials(name || 'Utilisateur');
    $('avatar-utilisateur').title = name ? `${name}${role}` : 'Utilisateur non connecté';
    $('utilisateur-connecte').textContent = name ? `${name}${role}` : 'Non connecté(e)';
  }

  function resetMemberSelection() {
    state.membreId = null;
    $('p-membre').value = '';
    setMemberView(null);
    $('recu-reference').textContent = '—';
    $('recu-membre').textContent = 'Sélectionnez un membre';
    $('recu-montant').textContent = '—';
    $('recu-date').textContent = '—';
    $('recu-mode').textContent = '—';
  }

  function message(element, text) {
    element.textContent = text;
    element.hidden = !text;
  }

  function selectMode() {
    return document.querySelector('input[name="mode-paiement"]:checked')?.value || '';
  }

  function selectedMember() {
    return state.membres.find((membre) => String(membre.id) === String(state.membreId));
  }

  function memberPayments(memberId) {
    return state.paiements.filter((paiement) => String(paiement.membre_id) === String(memberId));
  }

  function memberTotals(member) {
    const paid = memberPayments(member.id).reduce((sum, paiement) => sum + Number(paiement.montant || 0), 0);
    return { paid, due: Number(member.solde || 0), earned: paid + Number(member.solde || 0) };
  }

  function setMemberView(member) {
    if (!member) {
      ['member-total-earned', 'member-total-paid', 'member-balance', 'montant-du', 'montant-deja-paye', 'montant-maximum'].forEach((id) => { $(id).textContent = '—'; });
      $('member-name').textContent = 'Sélectionnez un membre';
      $('member-avatar').textContent = '--';
      $('member-contact').textContent = 'Ph: —';
      $('member-village').textContent = 'Village: —';
      return;
    }
    const totals = memberTotals(member);
    $('member-avatar').textContent = initials(member.nom);
    $('member-name').textContent = member.nom;
    $('member-contact').textContent = `Ph: ${member.contact || '—'}`;
    $('member-village').textContent = `Village: ${member.village || '—'}`;
    $('member-adhesion').textContent = `Date de jointure: ${member.date_adhesion || '—'}`;
    $('member-total-earned').textContent = money(totals.earned);
    $('member-total-paid').textContent = money(totals.paid);
    $('member-balance').textContent = money(totals.due);
    $('montant-du').textContent = money(totals.earned);
    $('montant-deja-paye').textContent = money(totals.paid);
    $('montant-maximum').textContent = money(totals.due);
    $('recu-membre').textContent = member.nom;
    updatePaymentControl();
  }

  function updatePaymentControl() {
    const member = selectedMember();
    const amount = Number($('p-montant').value || 0);
    const due = Number(member?.solde || 0);
    const invalid = !member || !Number.isFinite(amount) || amount <= 0 || amount > due || !$('p-date').value;
    $('btn-enregistrer').disabled = invalid;
    $('recu-montant').textContent = amount > 0 ? money(amount) : '—';
    $('recu-date').textContent = $('p-date').value ? new Date(`${$('p-date').value}T12:00:00`).toLocaleDateString('fr-FR') : '—';
    $('recu-mode').textContent = selectMode() || '—';
    $('alerte-paiement').hidden = !(member && amount > due);
    $('alerte-paiement').textContent = member && amount > due ? `Paiement refusé : le maximum autorisé est ${money(due)}.` : '';
  }

  function renderMembers() {
    const select = $('p-membre');
    select.replaceChildren(new Option('-- Choisir un membre --', ''));
    state.membres.forEach((member) => select.add(new Option(`${member.nom} — solde ${money(member.solde)}`, member.id)));
  }

  function paymentDate(payment) {
    return new Date(`${payment.date}T12:00:00`);
  }

  function isVisible(payment) {
    if (state.filtre === 'all') return true;
    const date = paymentDate(payment);
    const now = new Date();
    if (state.filtre === 'today') return date.toDateString() === now.toDateString();
    if (state.filtre === 'month') return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    return date >= start;
  }

  function showReceipt(payment) {
    $('recu-reference').textContent = `AC-${payment.id}`;
    $('recu-membre').textContent = payment.membre_nom || 'Inconnu';
    $('recu-montant').textContent = money(payment.montant);
    $('recu-date').textContent = payment.date;
    $('recu-mode').textContent = payment.mode_paiement || '—';
    document.querySelector('.receipt-section').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function printReceipt() {
    const receipt = document.querySelector('.receipt');
    if (!receipt || $('recu-reference').textContent === '—') {
      message($('message-global'), 'Enregistrez ou sélectionnez un paiement avant d’imprimer le reçu.');
      return;
    }
    receipt.classList.add('print-target');
    window.setTimeout(() => {
      window.print();
      receipt.classList.remove('print-target');
    }, 50);
  }

  function renderHistory() {
    const target = $('liste-paiements');
    target.replaceChildren();
    const visible = state.paiements.filter(isVisible).sort((a, b) => paymentDate(b) - paymentDate(a));
    if (!visible.length) {
      const row = target.insertRow();
      const cell = row.insertCell(); cell.colSpan = 8; cell.textContent = 'Aucun paiement pour cette période.';
      return;
    }
    visible.forEach((payment) => {
      const row = target.insertRow();
      [
        `AC-${payment.id}`, payment.date, payment.membre_nom || 'Inconnu', money(payment.montant),
        payment.mode_paiement || '—', 'Agent',
      ].forEach((value) => { row.insertCell().textContent = value; });
      const status = row.insertCell();
      const badge = document.createElement('span'); badge.className = 'badge badge-validated'; badge.textContent = 'Validé'; status.appendChild(badge);
      const action = row.insertCell();
      const button = document.createElement('button'); button.className = 'table-action'; button.type = 'button'; button.textContent = 'Voir le reçu'; button.addEventListener('click', () => showReceipt(payment)); action.appendChild(button);
    });
  }

  function renderSummary() {
    const total = state.paiements.reduce((sum, payment) => sum + Number(payment.montant || 0), 0);
    const month = new Date().toISOString().slice(0, 7);
    $('summary-count').textContent = state.paiements.length;
    $('summary-total').textContent = money(total);
    $('summary-month').textContent = money(state.paiements.filter((payment) => String(payment.date).startsWith(month)).reduce((sum, payment) => sum + Number(payment.montant || 0), 0));
    $('summary-balance').textContent = money(state.membres.reduce((sum, member) => sum + Number(member.solde || 0), 0));
    $('summary-today').textContent = state.paiements.filter((payment) => payment.date === today()).length;
  }

  async function request(path, options) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    let response;
    try {
      response = await fetch(`${API_URL}${path}`, { ...options, signal: controller.signal });
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('Le serveur met trop de temps à répondre.');
      throw new Error('Serveur inaccessible. Vérifiez que le backend est démarré.');
    } finally {
      window.clearTimeout(timeout);
    }
    let data;
    try { data = await response.json(); } catch { throw new Error('Réponse invalide du serveur.'); }
    if (!response.ok) throw new Error(data.erreur || (data.anomalies || []).join(' ') || 'Réponse API invalide.');
    return data;
  }

  async function loadData() {
    try {
      const [members, payments] = await Promise.all([request('/membres'), request('/paiements')]);
      state.membres = members.membres || [];
      state.paiements = payments.paiements || [];
      renderMembers(); renderHistory(); renderSummary();
      message($('message-global'), '');
    } catch (error) {
      message($('message-global'), `Impossible de charger les données : ${error.message} Vérifiez que le backend est démarré.`);
    }
  }

  async function submitPayment(event) {
    event.preventDefault();
    const member = selectedMember();
    const amount = Number($('p-montant').value);
    const date = $('p-date').value;
    message($('message-erreur-paiement'), ''); message($('message-succes-paiement'), '');
    if (!member || !Number.isFinite(amount) || amount <= 0 || !date) return message($('message-erreur-paiement'), 'Sélectionnez un membre, une date et un montant positif.');
    if (new Date(`${date}T12:00:00`) > new Date()) return message($('message-erreur-paiement'), 'La date du paiement ne peut pas être dans le futur.');
    if (amount > Number(member.solde || 0)) return message($('message-erreur-paiement'), `Paiement refusé : le maximum autorisé est ${money(member.solde)}.`);
    try {
      const result = await request('/paiements', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ membre_id: Number(member.id), montant: amount, date, mode_paiement: selectMode() }) });
      showReceipt({ ...result.paiement, membre_nom: member.nom });
      message($('message-succes-paiement'), `${result.recu || 'Paiement enregistré.'} Nouveau solde : ${money(result.nouveau_solde)}.`);
      $('form-paiement').reset(); $('p-date').value = today(); resetMemberSelection();
      await loadData();
    } catch (error) { message($('message-erreur-paiement'), error.message); }
  }

  function setup() {
    loadSession();
    $('p-date').value = today();
    $('p-membre').addEventListener('change', () => { state.membreId = $('p-membre').value; setMemberView(selectedMember()); });
    ['p-montant', 'p-date'].forEach((id) => $(id).addEventListener('input', updatePaymentControl));
    document.querySelectorAll('input[name="mode-paiement"]').forEach((radio) => radio.addEventListener('change', updatePaymentControl));
    $('form-paiement').addEventListener('submit', submitPayment);
    $('p-date').max = today();
    $('btn-nouveau-paiement').addEventListener('click', () => { $('form-paiement').reset(); $('p-date').value = today(); resetMemberSelection(); $('p-membre').focus(); updatePaymentControl(); });
    $('btn-imprimer').addEventListener('click', printReceipt);
    $('btn-pdf').addEventListener('click', () => {
      if ($('recu-reference').textContent === '—') {
        message($('message-global'), 'Enregistrez ou sélectionnez un paiement avant de télécharger le reçu.');
        return;
      }
      message($('message-global'), 'Dans la fenêtre d’impression, choisissez « Enregistrer au format PDF ».');
      printReceipt();
    });
    $('btn-deconnexion').addEventListener('click', () => {
      localStorage.removeItem('agricoop_utilisateur');
      window.location.href = 'frontend/login/login.html';
    });
    document.querySelectorAll('[data-filter]').forEach((button) => button.addEventListener('click', () => { state.filtre = button.dataset.filter; document.querySelectorAll('[data-filter]').forEach((item) => item.classList.toggle('active', item === button)); renderHistory(); }));
    updatePaymentControl(); loadData();
  }

  document.addEventListener('DOMContentLoaded', setup);
})();
