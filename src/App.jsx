import { useState, useEffect, useMemo } from "react";
import { supabase } from "./supabaseClient";
import {
  Search,
  Plus,
  X,
  Building2,
  ShieldCheck,
  Trash2,
  ChevronLeft,
  BadgeCheck,
  ArrowRight,
  LogOut,
  Lock,
  Mail,
} from "lucide-react";

// ---- Design tokens -----------------------------------------------------
const INK = "#10233F";        // cover navy
const INK_DARK = "#0A1930";
const PAPER = "#F1ECDD";      // passport page cream
const PAPER_LINE = "#E4DCC4";
const GOLD = "#B8934A";
const GOLD_LIGHT = "#D8BD84";
const STAMP_GREEN = "#2F6F4E";
const STAMP_AMBER = "#B4791E";
const STAMP_RED = "#A0362B";
const INK_TEXT = "#2A2013";

const DISPLAY_FONT = "'Iowan Old Style', 'Palatino Linotype', Georgia, serif";
const DATA_FONT = "'Courier New', ui-monospace, SFMono-Regular, monospace";

const DOC_TYPES = [
  "RCCM Business Registration",
  "Numéro Impôt (Tax ID) Certificate",
  "INSS Social Security Compliance",
  "Vehicle Insurance (Assurance Véhicule)",
  "Driver's License Verification",
  "Vehicle Roadworthiness (Contrôle Technique)",
  "Medical Supply Import Permit",
  "Cold Chain / Storage Certification",
  "Safety Certification",
  "Anti-Bribery Attestation",
];

const CATEGORIES = [
  "Fleet & Transport",
  "Medical Supply",
  "Construction",
  "IT & Services",
  "Fuel & Logistics",
  "Facilities",
  "Consulting",
];

const COUNTRIES = [
  { code: "CD", label: "DR Congo", flag: "🇨🇩" },
  { code: "ZA", label: "South Africa", flag: "🇿🇦" },
];

function countryMeta(code) {
  return COUNTRIES.find((c) => c.code === code) || COUNTRIES[0];
}

function daysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  return Math.round((d - today) / 86400000);
}

function docStatus(doc) {
  const days = daysUntil(doc.expiryDate);
  if (days < 0) return "expired";
  if (days <= 30) return "expiring";
  return "valid";
}

function vendorStatus(vendor) {
  if (!vendor.documents.length) return "incomplete";
  const statuses = vendor.documents.map(docStatus);
  if (statuses.includes("expired")) return "expired";
  if (statuses.includes("expiring")) return "expiring";
  return "valid";
}

const STATUS_META = {
  valid: { label: "In Good Standing", color: STAMP_GREEN },
  expiring: { label: "Renewal Due", color: STAMP_AMBER },
  expired: { label: "Non-Compliant", color: STAMP_RED },
  incomplete: { label: "No Records", color: "#8A8272" },
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function seedVendors() {
  const today = new Date();
  const iso = (offsetDays) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().slice(0, 10);
  };
  return [
    {
      id: uid(),
      name: "Kivu Freight & Logistics SARL",
      category: "Fleet & Transport",
      country: "CD",
      contact: "ops@kivufreight.cd",
      memberSince: "2024-03-11",
      documents: [
        { id: uid(), type: "RCCM Business Registration", issueDate: "2023-01-10", expiryDate: iso(400) },
        { id: uid(), type: "Vehicle Insurance (Assurance Véhicule)", issueDate: "2025-06-01", expiryDate: iso(-5) },
        { id: uid(), type: "Vehicle Roadworthiness (Contrôle Technique)", issueDate: "2025-01-15", expiryDate: iso(18) },
      ],
    },
    {
      id: uid(),
      name: "Mont Amba Construction",
      category: "Construction",
      country: "CD",
      contact: "info@montamba.cd",
      memberSince: "2023-11-02",
      documents: [
        { id: uid(), type: "RCCM Business Registration", issueDate: "2022-05-01", expiryDate: iso(600) },
        { id: uid(), type: "INSS Social Security Compliance", issueDate: "2024-09-01", expiryDate: iso(200) },
      ],
    },
    {
      id: uid(),
      name: "Bralima Cold Chain Supply",
      category: "Medical Supply",
      country: "CD",
      contact: "compliance@bralimacc.cd",
      memberSince: "2025-01-20",
      documents: [],
    },
    {
      id: uid(),
      name: "Highveld Fleet Parts (Pty) Ltd",
      category: "Fuel & Logistics",
      country: "ZA",
      contact: "accounts@highveldfleet.co.za",
      memberSince: "2025-04-02",
      documents: [
        { id: uid(), type: "RCCM Business Registration", issueDate: "2021-02-01", expiryDate: iso(500) },
      ],
    },
  ];
}

// ---- Stamp -------------------------------------------------------------
function Stamp({ doc, onRemove, angle }) {
  const status = docStatus(doc);
  const color = STATUS_META[status].color;
  const days = daysUntil(doc.expiryDate);
  const sub =
    status === "expired"
      ? `EXPIRED ${Math.abs(days)}D AGO`
      : status === "expiring"
      ? `EXPIRES IN ${days}D`
      : `VALID THRU ${doc.expiryDate}`;

  return (
    <div
      className="relative group"
      style={{ transform: `rotate(${angle}deg)` }}
    >
      <div
        className="flex flex-col items-center justify-center text-center px-3 py-3 rounded-full"
        style={{
          width: 148,
          height: 148,
          border: `3px double ${color}`,
          color: color,
          fontFamily: DATA_FONT,
          mixBlendMode: "multiply",
          opacity: 0.88,
        }}
      >
        <div style={{ fontSize: 9, letterSpacing: 1, lineHeight: 1.25, fontWeight: 700 }}>
          {doc.type.toUpperCase()}
        </div>
        <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: 1.5, margin: "4px 0" }}>
          {status === "valid" ? "APPROVED" : status === "expiring" ? "RENEW" : "EXPIRED"}
        </div>
        <div style={{ fontSize: 8, letterSpacing: 0.5 }}>{sub}</div>
      </div>
      <button
        onClick={onRemove}
        className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity rounded-full p-1"
        style={{ backgroundColor: INK_DARK, transform: `rotate(${-angle}deg)` }}
        aria-label="Remove document"
      >
        <X size={12} color={PAPER} />
      </button>
    </div>
  );
}

// ---- Add Document Form ---------------------------------------------------
function AddDocumentForm({ onAdd, onCancel }) {
  const [type, setType] = useState(DOC_TYPES[0]);
  const [customType, setCustomType] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [error, setError] = useState("");

  const finalType = type === "__custom" ? customType : type;

  function validate() {
    if (!finalType.trim()) return "Choose or enter a document type.";
    if (!issueDate) return "Issue date is required.";
    if (!expiryDate) return "Expiry date is required.";
    if (new Date(expiryDate) <= new Date(issueDate)) {
      return "Expiry date must be after the issue date.";
    }
    return "";
  }

  function handleSubmit() {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError("");
    onAdd({ id: uid(), type: finalType.trim(), issueDate, expiryDate });
  }

  return (
    <div
      className="p-4 rounded-lg mt-3"
      style={{ backgroundColor: "#E9E1CB", border: `1px solid ${PAPER_LINE}` }}
    >
      <div className="grid grid-cols-1 gap-3">
        <div>
          <label style={{ fontFamily: DATA_FONT, fontSize: 11, color: INK_TEXT }}>DOCUMENT TYPE</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full mt-1 px-2 py-2 rounded"
            style={{ border: `1px solid ${GOLD}`, backgroundColor: PAPER, fontFamily: DATA_FONT, fontSize: 13 }}
          >
            {DOC_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
            <option value="__custom">Other / custom...</option>
          </select>
        </div>
        {type === "__custom" && (
          <input
            value={customType}
            onChange={(e) => setCustomType(e.target.value)}
            placeholder="Document name"
            className="w-full px-2 py-2 rounded"
            style={{ border: `1px solid ${GOLD}`, backgroundColor: PAPER, fontFamily: DATA_FONT, fontSize: 13 }}
          />
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label style={{ fontFamily: DATA_FONT, fontSize: 11, color: INK_TEXT }}>ISSUE DATE</label>
            <input
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="w-full mt-1 px-2 py-2 rounded"
              style={{ border: `1px solid ${GOLD}`, backgroundColor: PAPER, fontFamily: DATA_FONT, fontSize: 13 }}
            />
          </div>
          <div>
            <label style={{ fontFamily: DATA_FONT, fontSize: 11, color: INK_TEXT }}>EXPIRY DATE</label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full mt-1 px-2 py-2 rounded"
              style={{ border: `1px solid ${GOLD}`, backgroundColor: PAPER, fontFamily: DATA_FONT, fontSize: 13 }}
            />
          </div>
        </div>
      </div>

      {error && (
        <p className="mt-3" style={{ fontFamily: DATA_FONT, fontSize: 12, color: STAMP_RED }}>
          {error}
        </p>
      )}

      <div className="flex gap-2 mt-4">
        <button
          onClick={handleSubmit}
          className="px-4 py-2 rounded font-semibold"
          style={{ backgroundColor: INK, color: PAPER, fontFamily: DATA_FONT, fontSize: 12, letterSpacing: 1 }}
        >
          STAMP DOCUMENT
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded font-semibold"
          style={{ border: `1px solid ${INK}`, color: INK, fontFamily: DATA_FONT, fontSize: 12, letterSpacing: 1 }}
        >
          CANCEL
        </button>
      </div>
    </div>
  );
}

// ---- Passport Detail View ------------------------------------------------
// ---- Confirm Dialog -----------------------------------------------------
function ConfirmDialog({ title, message, confirmLabel, onConfirm, onCancel }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5"
      style={{ backgroundColor: "rgba(10,25,48,0.75)" }}
    >
      <div
        className="w-full max-w-sm rounded-xl p-6"
        style={{ backgroundColor: PAPER, border: `1px solid ${STAMP_RED}` }}
      >
        <h3 style={{ fontFamily: DISPLAY_FONT, fontSize: 19, color: INK_TEXT }} className="mb-2">
          {title}
        </h3>
        <p style={{ fontFamily: DATA_FONT, fontSize: 12, color: "#6B6250", lineHeight: 1.6 }} className="mb-6">
          {message}
        </p>
        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            className="flex-1 py-2 rounded font-semibold"
            style={{ backgroundColor: STAMP_RED, color: PAPER, fontFamily: DATA_FONT, fontSize: 12, letterSpacing: 1 }}
          >
            {confirmLabel || "DELETE"}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded font-semibold"
            style={{ border: `1px solid ${INK}`, color: INK, fontFamily: DATA_FONT, fontSize: 12, letterSpacing: 1 }}
          >
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
}

function PassportDetail({ vendor, onBack, onAddDocument, onRemoveDocument, onDelete }) {
  const [adding, setAdding] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmDocId, setConfirmDocId] = useState(null);
  const status = vendorStatus(vendor);
  const meta = STATUS_META[status];

  const angles = useMemo(
    () => vendor.documents.map(() => Math.floor(Math.random() * 16 - 8)),
    [vendor.documents.length]
  );

  return (
    <div className="max-w-5xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-1 mb-4 text-sm"
        style={{ color: GOLD_LIGHT, fontFamily: DATA_FONT }}
      >
        <ChevronLeft size={16} /> ALL VENDORS
      </button>

      <div
        className="rounded-xl overflow-hidden shadow-2xl grid grid-cols-1 md:grid-cols-2"
        style={{ minHeight: 480 }}
      >
        {/* Left page: bio data */}
        <div
          className="p-8 relative"
          style={{
            backgroundColor: PAPER,
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 27px, ${PAPER_LINE} 28px)`,
            borderRight: `2px dashed ${GOLD}`,
          }}
        >
          <div className="flex items-center gap-2 mb-6" style={{ color: GOLD }}>
            <ShieldCheck size={20} />
            <span style={{ fontFamily: DATA_FONT, fontSize: 11, letterSpacing: 2 }}>
              COMPLISURE
            </span>
          </div>

          <h1
            style={{ fontFamily: DISPLAY_FONT, color: INK_TEXT, fontSize: 28, lineHeight: 1.15 }}
            className="mb-1 flex items-center gap-2"
          >
            <span style={{ fontSize: 22 }}>{countryMeta(vendor.country).flag}</span>
            {vendor.name}
          </h1>
          <p style={{ fontFamily: DATA_FONT, fontSize: 12, color: "#6B6250", letterSpacing: 1 }}>
            {vendor.category.toUpperCase()} · {countryMeta(vendor.country).label.toUpperCase()}
          </p>

          <div className="mt-6 space-y-3" style={{ fontFamily: DATA_FONT, fontSize: 13, color: INK_TEXT }}>
            <div>
              <span style={{ color: "#8A8272" }}>CONTACT — </span>
              {vendor.contact || "—"}
            </div>
            <div>
              <span style={{ color: "#8A8272" }}>PASSPORT ISSUED — </span>
              {vendor.memberSince}
            </div>
            <div>
              <span style={{ color: "#8A8272" }}>RECORD ID — </span>
              {vendor.id.toUpperCase()}
            </div>
          </div>

          <div
            className="mt-8 inline-flex items-center gap-2 px-3 py-2 rounded-full"
            style={{ border: `2px solid ${meta.color}`, color: meta.color }}
          >
            <BadgeCheck size={16} />
            <span style={{ fontFamily: DATA_FONT, fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>
              {meta.label.toUpperCase()}
            </span>
          </div>

          <button
            onClick={() => setConfirmDelete(true)}
            className="absolute bottom-6 left-8 flex items-center gap-1 text-xs"
            style={{ color: STAMP_RED, fontFamily: DATA_FONT }}
          >
            <Trash2 size={13} /> REMOVE VENDOR PASSPORT
          </button>

          {confirmDelete && (
            <ConfirmDialog
              title="Remove this vendor passport?"
              message={`This permanently deletes "${vendor.name}" and all ${vendor.documents.length} attached compliance document${vendor.documents.length === 1 ? "" : "s"}. This cannot be undone.`}
              confirmLabel="DELETE VENDOR"
              onConfirm={() => {
                setConfirmDelete(false);
                onDelete(vendor.id);
              }}
              onCancel={() => setConfirmDelete(false)}
            />
          )}
        </div>

        {/* Right page: stamps */}
        <div
          className="p-8"
          style={{
            backgroundColor: PAPER,
            backgroundImage: `radial-gradient(${PAPER_LINE} 1px, transparent 1px)`,
            backgroundSize: "14px 14px",
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <span style={{ fontFamily: DATA_FONT, fontSize: 11, letterSpacing: 2, color: "#8A8272" }}>
              VISA & ENDORSEMENT STAMPS
            </span>
            <button
              onClick={() => setAdding((a) => !a)}
              className="flex items-center gap-1 px-2 py-1 rounded"
              style={{ backgroundColor: INK, color: PAPER, fontFamily: DATA_FONT, fontSize: 11 }}
            >
              <Plus size={13} /> ADD
            </button>
          </div>

          {vendor.documents.length === 0 && !adding && (
            <div
              className="flex flex-col items-center justify-center text-center py-14 rounded-lg"
              style={{ border: `1px dashed ${GOLD}`, color: "#8A8272" }}
            >
              <p style={{ fontFamily: DATA_FONT, fontSize: 12 }}>
                No stamps yet. Add the vendor's first compliance document.
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-5">
            {vendor.documents.map((doc, i) => (
              <Stamp
                key={doc.id}
                doc={doc}
                angle={angles[i] || 0}
                onRemove={() => setConfirmDocId(doc.id)}
              />
            ))}
          </div>

          {confirmDocId && (
            <ConfirmDialog
              title="Remove this document?"
              message={`This deletes the "${vendor.documents.find((d) => d.id === confirmDocId)?.type}" record from ${vendor.name}'s passport. This cannot be undone.`}
              confirmLabel="REMOVE DOCUMENT"
              onConfirm={() => {
                onRemoveDocument(confirmDocId);
                setConfirmDocId(null);
              }}
              onCancel={() => setConfirmDocId(null)}
            />
          )}

          {adding && (
            <AddDocumentForm
              onCancel={() => setAdding(false)}
              onAdd={(doc) => {
                onAddDocument(vendor.id, doc);
                setAdding(false);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ---- Vendor Cover Card ----------------------------------------------------
function VendorCover({ vendor, onOpen }) {
  const status = vendorStatus(vendor);
  const meta = STATUS_META[status];
  return (
    <button
      onClick={onOpen}
      className="text-left rounded-lg p-5 transition-transform hover:-translate-y-1 focus:outline-none focus-visible:ring-2"
      style={{
        backgroundColor: INK,
        backgroundImage: `linear-gradient(135deg, ${INK} 0%, ${INK_DARK} 100%)`,
        border: `1px solid ${GOLD}`,
        boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <ShieldCheck size={22} color={GOLD_LIGHT} />
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 16 }} title={countryMeta(vendor.country).label}>
            {countryMeta(vendor.country).flag}
          </span>
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: meta.color }}
            title={meta.label}
          />
        </div>
      </div>
      <h3 style={{ fontFamily: DISPLAY_FONT, color: PAPER, fontSize: 19, lineHeight: 1.25 }}>
        {vendor.name}
      </h3>
      <p style={{ fontFamily: DATA_FONT, fontSize: 11, color: GOLD_LIGHT, letterSpacing: 1, marginTop: 6 }}>
        {vendor.category.toUpperCase()}
      </p>
      <div className="flex items-center justify-between mt-8">
        <span style={{ fontFamily: DATA_FONT, fontSize: 11, color: meta.color, fontWeight: 700 }}>
          {meta.label}
        </span>
        <ArrowRight size={15} color={GOLD_LIGHT} />
      </div>
    </button>
  );
}

// ---- Register Vendor Form ---------------------------------------------
function RegisterVendorForm({ onCreate, onCancel }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [country, setCountry] = useState(COUNTRIES[0].code);
  const [contact, setContact] = useState("");
  const [error, setError] = useState("");

  function validate() {
    if (name.trim().length < 2) return "Vendor name must be at least 2 characters.";
    if (contact.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.trim())) {
      return "Enter a valid email address, or leave contact blank.";
    }
    return "";
  }

  function handleSubmit() {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError("");
    onCreate({
      name: name.trim(),
      category,
      country,
      contact: contact.trim(),
    });
  }

  return (
    <div
      className="rounded-xl p-6 mb-8"
      style={{ backgroundColor: PAPER, border: `1px solid ${GOLD}` }}
    >
      <h3 style={{ fontFamily: DISPLAY_FONT, fontSize: 20, color: INK_TEXT }} className="mb-4">
        Register a New Vendor Passport
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label style={{ fontFamily: DATA_FONT, fontSize: 11, color: "#6B6250" }}>VENDOR NAME</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded"
            style={{ border: `1px solid ${GOLD}`, fontFamily: DATA_FONT, fontSize: 13, backgroundColor: "#fff" }}
            placeholder="e.g. Kinshasa Freight Co."
          />
        </div>
        <div>
          <label style={{ fontFamily: DATA_FONT, fontSize: 11, color: "#6B6250" }}>COUNTRY</label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded"
            style={{ border: `1px solid ${GOLD}`, fontFamily: DATA_FONT, fontSize: 13, backgroundColor: "#fff" }}
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.flag} {c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontFamily: DATA_FONT, fontSize: 11, color: "#6B6250" }}>CATEGORY</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded"
            style={{ border: `1px solid ${GOLD}`, fontFamily: DATA_FONT, fontSize: 13, backgroundColor: "#fff" }}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontFamily: DATA_FONT, fontSize: 11, color: "#6B6250" }}>CONTACT EMAIL</label>
          <input
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded"
            style={{ border: `1px solid ${GOLD}`, fontFamily: DATA_FONT, fontSize: 13, backgroundColor: "#fff" }}
            placeholder="compliance@vendor.cd"
          />
        </div>
      </div>

      {error && (
        <p className="mt-3" style={{ fontFamily: DATA_FONT, fontSize: 12, color: STAMP_RED }}>
          {error}
        </p>
      )}

      <div className="flex gap-2 mt-5">
        <button
          onClick={handleSubmit}
          className="px-5 py-2 rounded font-semibold"
          style={{ backgroundColor: INK, color: PAPER, fontFamily: DATA_FONT, fontSize: 12, letterSpacing: 1 }}
        >
          ISSUE PASSPORT
        </button>
        <button
          onClick={onCancel}
          className="px-5 py-2 rounded font-semibold"
          style={{ border: `1px solid ${INK}`, color: INK, fontFamily: DATA_FONT, fontSize: 12, letterSpacing: 1 }}
        >
          CANCEL
        </button>
      </div>
    </div>
  );
}

// ---- Login Screen -----------------------------------------------------
function LoginScreen({ onAuthed }) {
  const [mode, setMode] = useState("signin"); // signin | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    if (!email.trim() || !password) {
      setError("Enter both email and password.");
      return;
    }
    setLoading(true);
    if (mode === "signin") {
      const { data, error: err } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      setLoading(false);
      if (err) {
        setError(err.message);
        return;
      }
      if (data?.session) onAuthed();
    } else {
      const { error: err } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      setLoading(false);
      if (err) {
        setError(err.message);
        return;
      }
      setNotice("Account created. Check your email to confirm, then sign in.");
      setMode("signin");
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-5"
      style={{ backgroundColor: INK_DARK }}
    >
      <div
        className="w-full max-w-sm rounded-xl p-8"
        style={{ backgroundColor: PAPER, border: `1px solid ${GOLD}` }}
      >
        <div className="flex items-center gap-2 mb-1" style={{ color: GOLD }}>
          <ShieldCheck size={20} />
          <span style={{ fontFamily: DATA_FONT, fontSize: 11, letterSpacing: 2 }}>
            COMPLISURE
          </span>
        </div>
        <h1 style={{ fontFamily: DISPLAY_FONT, fontSize: 24, color: INK_TEXT }} className="mb-6">
          {mode === "signin" ? "Sign In" : "Create Your Account"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label style={{ fontFamily: DATA_FONT, fontSize: 11, color: "#6B6250" }}>EMAIL</label>
            <div className="flex items-center gap-2 mt-1 px-3 py-2 rounded" style={{ border: `1px solid ${GOLD}`, backgroundColor: "#fff" }}>
              <Mail size={14} color="#8A8272" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full outline-none bg-transparent"
                style={{ fontFamily: DATA_FONT, fontSize: 13 }}
                placeholder="you@company.com"
                autoComplete="email"
              />
            </div>
          </div>
          <div>
            <label style={{ fontFamily: DATA_FONT, fontSize: 11, color: "#6B6250" }}>PASSWORD</label>
            <div className="flex items-center gap-2 mt-1 px-3 py-2 rounded" style={{ border: `1px solid ${GOLD}`, backgroundColor: "#fff" }}>
              <Lock size={14} color="#8A8272" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full outline-none bg-transparent"
                style={{ fontFamily: DATA_FONT, fontSize: 13 }}
                placeholder="••••••••"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
              />
            </div>
          </div>

          {error && (
            <p style={{ fontFamily: DATA_FONT, fontSize: 12, color: STAMP_RED }}>{error}</p>
          )}
          {notice && (
            <p style={{ fontFamily: DATA_FONT, fontSize: 12, color: STAMP_GREEN }}>{notice}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded font-semibold disabled:opacity-50"
            style={{ backgroundColor: INK, color: PAPER, fontFamily: DATA_FONT, fontSize: 12, letterSpacing: 1 }}
          >
            {loading ? "PLEASE WAIT…" : mode === "signin" ? "SIGN IN" : "CREATE ACCOUNT"}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError("");
            setNotice("");
          }}
          className="w-full text-center mt-5"
          style={{ fontFamily: DATA_FONT, fontSize: 12, color: "#6B6250" }}
        >
          {mode === "signin" ? "Need an account? Register here" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}

// ---- Main App -------------------------------------------------------------
export default function VendorCompliancePassport() {
  const [session, setSession] = useState(undefined); // undefined = checking, null = signed out
  const [vendors, setVendors] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [showRegister, setShowRegister] = useState(false);

  async function loadVendors() {
    const { data, error } = await supabase
      .from("vendors")
      .select("id, name, category, country, contact, member_since, documents(id, type, issue_date, expiry_date)")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to load vendors:", error);
      setLoaded(true);
      return;
    }

    const mapped = (data || []).map((v) => ({
      id: v.id,
      name: v.name,
      category: v.category,
      country: v.country,
      contact: v.contact,
      memberSince: v.member_since,
      documents: (v.documents || []).map((d) => ({
        id: d.id,
        type: d.type,
        issueDate: d.issue_date,
        expiryDate: d.expiry_date,
      })),
    }));
    setVendors(mapped);
    setLoaded(true);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) loadVendors();
  }, [session]);

  async function createVendor(vendor) {
    const { data, error } = await supabase
      .from("vendors")
      .insert({
        name: vendor.name,
        category: vendor.category,
        country: vendor.country,
        contact: vendor.contact,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create vendor:", error);
      return;
    }

    setVendors((vs) => [
      ...vs,
      {
        id: data.id,
        name: data.name,
        category: data.category,
        country: data.country,
        contact: data.contact,
        memberSince: data.member_since,
        documents: [],
      },
    ]);
  }

  async function addDocument(vendorId, doc) {
    const { data, error } = await supabase
      .from("documents")
      .insert({
        vendor_id: vendorId,
        type: doc.type,
        issue_date: doc.issueDate,
        expiry_date: doc.expiryDate,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to add document:", error);
      return;
    }

    setVendors((vs) =>
      vs.map((v) =>
        v.id === vendorId
          ? {
              ...v,
              documents: [
                ...v.documents,
                { id: data.id, type: data.type, issueDate: data.issue_date, expiryDate: data.expiry_date },
              ],
            }
          : v
      )
    );
  }

  async function removeDocument(docId) {
    const { error } = await supabase.from("documents").delete().eq("id", docId);
    if (error) {
      console.error("Failed to remove document:", error);
      return;
    }
    setVendors((vs) =>
      vs.map((v) => ({ ...v, documents: v.documents.filter((d) => d.id !== docId) }))
    );
  }

  async function deleteVendor(id) {
    const { error } = await supabase.from("vendors").delete().eq("id", id);
    if (error) {
      console.error("Failed to delete vendor:", error);
      return;
    }
    setVendors((vs) => vs.filter((v) => v.id !== id));
    setSelectedId(null);
  }

  const selected = vendors.find((v) => v.id === selectedId);

  const filtered = vendors.filter((v) => {
    const matchesQuery = v.name.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === "all" || vendorStatus(v) === filter;
    const matchesCountry = countryFilter === "all" || v.country === countryFilter;
    return matchesQuery && matchesFilter && matchesCountry;
  });

  const counts = useMemo(() => {
    const c = { valid: 0, expiring: 0, expired: 0, incomplete: 0 };
    vendors.forEach((v) => c[vendorStatus(v)]++);
    return c;
  }, [vendors]);

  if (session === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: INK_DARK }}>
        <span style={{ color: GOLD_LIGHT, fontFamily: DATA_FONT, fontSize: 13, letterSpacing: 2 }}>
          CHECKING CREDENTIALS…
        </span>
      </div>
    );
  }

  if (!session) {
    return <LoginScreen onAuthed={() => {}} />;
  }

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: INK_DARK }}>
        <span style={{ color: GOLD_LIGHT, fontFamily: DATA_FONT, fontSize: 13, letterSpacing: 2 }}>
          UNLOCKING REGISTRY…
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: INK_DARK }}>
      <div className="max-w-6xl mx-auto px-5 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <ShieldCheck size={26} color={GOLD} />
            <h1 style={{ fontFamily: DISPLAY_FONT, color: PAPER, fontSize: 30 }}>
              CompliSure
            </h1>
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            className="flex items-center gap-1 px-3 py-1.5 rounded"
            style={{ border: "1px solid #2A3B5C", color: "#8A8FA3", fontFamily: DATA_FONT, fontSize: 11 }}
          >
            <LogOut size={13} /> SIGN OUT
          </button>
        </div>
        <p style={{ fontFamily: DATA_FONT, fontSize: 12, color: "#8A8FA3", letterSpacing: 0.5 }} className="mb-8">
          A single stamped record of every vendor's standing — issued, renewed, and checked at the border of every contract.
        </p>

        {!selected && (
          <>
            {/* Stat bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {[
                { key: "valid", label: "In Good Standing" },
                { key: "expiring", label: "Renewal Due" },
                { key: "expired", label: "Non-Compliant" },
                { key: "incomplete", label: "No Records" },
              ].map((s) => (
                <button
                  key={s.key}
                  onClick={() => setFilter(filter === s.key ? "all" : s.key)}
                  className="rounded-lg p-4 text-left"
                  style={{
                    backgroundColor: filter === s.key ? STATUS_META[s.key].color : INK,
                    border: `1px solid ${filter === s.key ? STATUS_META[s.key].color : "#2A3B5C"}`,
                  }}
                >
                  <div
                    style={{
                      fontFamily: DATA_FONT,
                      fontSize: 24,
                      fontWeight: 800,
                      color: filter === s.key ? PAPER : STATUS_META[s.key].color,
                    }}
                  >
                    {counts[s.key]}
                  </div>
                  <div
                    style={{
                      fontFamily: DATA_FONT,
                      fontSize: 10,
                      letterSpacing: 0.5,
                      color: filter === s.key ? PAPER : "#8A8FA3",
                    }}
                  >
                    {s.label.toUpperCase()}
                  </div>
                </button>
              ))}
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg flex-1"
                style={{ backgroundColor: INK, border: "1px solid #2A3B5C" }}
              >
                <Search size={15} color="#8A8FA3" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search vendors..."
                  className="bg-transparent outline-none w-full"
                  style={{ color: PAPER, fontFamily: DATA_FONT, fontSize: 13 }}
                />
              </div>
              <button
                onClick={() => setShowRegister((s) => !s)}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold"
                style={{ backgroundColor: GOLD, color: INK_DARK, fontFamily: DATA_FONT, fontSize: 12, letterSpacing: 1 }}
              >
                <Plus size={15} /> REGISTER VENDOR
              </button>
            </div>

            <div className="flex items-center gap-2 mb-6">
              <span style={{ fontFamily: DATA_FONT, fontSize: 11, color: "#8A8FA3", letterSpacing: 0.5 }}>
                MARKET:
              </span>
              <button
                onClick={() => setCountryFilter("all")}
                className="px-3 py-1 rounded-full text-xs"
                style={{
                  border: `1px solid ${countryFilter === "all" ? GOLD : "#2A3B5C"}`,
                  color: countryFilter === "all" ? GOLD : "#8A8FA3",
                  fontFamily: DATA_FONT,
                }}
              >
                ALL
              </button>
              {COUNTRIES.map((c) => (
                <button
                  key={c.code}
                  onClick={() => setCountryFilter(countryFilter === c.code ? "all" : c.code)}
                  className="px-3 py-1 rounded-full text-xs flex items-center gap-1"
                  style={{
                    border: `1px solid ${countryFilter === c.code ? GOLD : "#2A3B5C"}`,
                    color: countryFilter === c.code ? GOLD : "#8A8FA3",
                    fontFamily: DATA_FONT,
                  }}
                >
                  <span>{c.flag}</span> {c.label}
                </button>
              ))}
            </div>

            {showRegister && (
              <RegisterVendorForm
                onCancel={() => setShowRegister(false)}
                onCreate={(v) => {
                  createVendor(v);
                  setShowRegister(false);
                }}
              />
            )}

            {/* Grid */}
            {filtered.length === 0 ? (
              <div
                className="rounded-lg p-10 text-center"
                style={{ border: "1px dashed #2A3B5C", color: "#8A8FA3" }}
              >
                <Building2 className="mx-auto mb-2" size={20} />
                <p style={{ fontFamily: DATA_FONT, fontSize: 13 }}>No vendors match this view.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((v) => (
                  <VendorCover key={v.id} vendor={v} onOpen={() => setSelectedId(v.id)} />
                ))}
              </div>
            )}
          </>
        )}

        {selected && (
          <PassportDetail
            vendor={selected}
            onBack={() => setSelectedId(null)}
            onAddDocument={addDocument}
            onRemoveDocument={removeDocument}
            onDelete={deleteVendor}
          />
        )}
      </div>
    </div>
  );
}
