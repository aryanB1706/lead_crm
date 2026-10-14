"use client";

import { useState } from "react";
import { createLead, updateLead } from "../lib/api";
import { STATUSES } from "../lib/constants";
import Modal from "./Modal";

/**
 * Add-lead dialog. Client validation + server 422 shown under fields.
 * @param {{onClose: () => void, onCreated: (lead: import('../lib/constants').Lead) => void}} props
 */
export default function AddLeadDialog({ onClose, onCreated }) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("New");
  const [nameError, setNameError] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const phoneHint =
    phone.trim() && !/^[+0-9][0-9\s\-()]*$/.test(phone.trim())
      ? "Unusual phone format — you can still save."
      : "";

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError("Name is required.");
      return;
    }
    setNameError("");
    setFormError("");
    setSaving(true);
    try {
      const body = { name: trimmed };
      if (company.trim()) body.company = company.trim();
      if (phone.trim()) body.phone = phone.trim();
      let created = await createLead(body);
      // POST has no status field (defaults to New); PATCH when user picked otherwise.
      if (status !== "New") {
        created = await updateLead(created.id, { status });
      }
      onCreated(created);
      onClose();
    } catch (err) {
      const msg = err?.message || "Failed to create lead";
      // Surface 422s under the relevant field.
      if (/name/i.test(msg)) setNameError(msg);
      else setFormError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose} label="Add lead">
      <form onSubmit={handleSubmit} className="space-y-3 p-4 sm:p-5">
        <div className="flex items-start justify-between">
          <h2 className="text-xl font-extrabold text-zinc-900">Add lead</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg px-2 py-1 text-xl leading-none font-bold text-zinc-700 hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            ×
          </button>
        </div>

        <label className="block text-sm font-semibold text-zinc-900">
          <span className="mb-1 block">Name *</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            autoFocus
            className="w-full rounded-lg border-2 border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          />
          {nameError ? <span className="mt-1 block text-sm text-red-600">{nameError}</span> : null}
        </label>

        <label className="block text-sm font-semibold text-zinc-900">
          <span className="mb-1 block">Company</span>
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Optional"
            className="w-full rounded-lg border-2 border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          />
        </label>

        <label className="block text-sm font-semibold text-zinc-900">
          <span className="mb-1 block">Phone</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Optional"
            inputMode="tel"
            className="w-full rounded-lg border-2 border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          />
          {phoneHint ? <span className="mt-1 block text-xs text-amber-700">{phoneHint}</span> : null}
        </label>

        <label className="block text-sm font-semibold text-zinc-900">
          <span className="mb-1 block">Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-lg border-2 border-zinc-300 bg-white px-2 py-2 text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        {formError ? (
          <p role="alert" className="text-sm text-red-600">{formError}</p>
        ) : null}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border-2 border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            {saving ? "Saving…" : "Create lead"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
