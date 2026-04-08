"use client";

import { useState } from "react";
import { PurchaseBuyer } from "@/types/Ticket";

type Props = {
  loading: boolean;
  onSubmit: (buyer: PurchaseBuyer) => void;
  onCancel: () => void;
};

export default function CheckoutForm({ loading, onSubmit, onCancel }: Props) {
  const [buyer, setBuyer] = useState<PurchaseBuyer>({
    name: "Isaiah Quintana",
    birthdate: "2002-07-26",
    email: "isaiahquintanadev@gmail.com",
    phone: "666198636",
  });
  const [acceptedAdults, setAcceptedAdults] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});

  const blockPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValidPhone = (phone: string) => {
    return /^(\+34|0034)?[6-9]\d{8}$/.test(phone.replace(/\s/g, ""));
  };

  const handleSubmit = () => {
    const errors: Record<string, boolean> = {};

    // if (!buyer.name) errors.name = true;
    // if (!buyer.birthdate) errors.birthdate = true;

    // if (!buyer.email || !isValidEmail(buyer.email)) errors.email = true;

    // if (!confirmEmail || buyer.email !== confirmEmail)
    //   errors.confirmEmail = true;

    // if (!buyer.phone || !isValidPhone(buyer.phone)) errors.phone = true;

    // if (!acceptedAdults) errors.acceptedAdults = true;

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setError("Revisa los campos marcados");
      return;
    }

    setError("");
    onSubmit(buyer);
  };

  const inputClass = (field: string) =>
    `w-full rounded-lg px-3 py-2 outline-none bg-white/10 
   focus:ring-2 focus:ring-purple-600
   ${fieldErrors[field] ? "ring-2 ring-red-500" : ""}`;

  return (
    <div className="pt-6 px-5 pb-5 border-t border-white/10 space-y-4">
      <h4 className="text-sm tracking-[0.2em] text-gray-400">
        DATOS DEL COMPRADOR
      </h4>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-400 block mb-1">
            Nombre completo
          </label>
          <input
            placeholder="Nombre y apellidos"
            className={inputClass("name")}
            value={buyer.name}
            onChange={(e) => setBuyer({ ...buyer, name: e.target.value })}
          />
        </div>

        <div>
          <label className="text-xs text-gray-400 block mb-1">
            Fecha de nacimiento
          </label>
          <input
            type="date"
            className={inputClass("birthdate")}
            value={buyer.birthdate}
            onChange={(e) => setBuyer({ ...buyer, birthdate: e.target.value })}
          />
        </div>

        <div>
          <label className="text-xs text-gray-400 block mb-1">Email</label>
          <input
            type="email"
            placeholder="nombre@email.com"
            className={inputClass("email")}
            value={buyer.email}
            onChange={(e) => setBuyer({ ...buyer, email: e.target.value })}
          />
        </div>

        <div>
          <label className="text-xs text-gray-400 block mb-1">
            Confirmar email
          </label>
          <input
            type="email"
            placeholder="Repite el email"
            className={inputClass("confirmEmail")}
            // value={confirmEmail}
            value={"isaiahquintanadev@gmail.com"}
            onChange={(e) => setConfirmEmail(e.target.value)}
            onPaste={blockPaste}
          />
        </div>

        <div>
          <label className="text-xs text-gray-400 block mb-1">Teléfono</label>
          <input
            placeholder="Ej: 600123123"
            className={inputClass("phone")}
            value={buyer.phone}
            onChange={(e) => setBuyer({ ...buyer, phone: e.target.value })}
          />
        </div>
      </div>

      <div className="flex items-start gap-3 pt-2">
        <input
          type="checkbox"
          checked={acceptedAdults}
          onChange={(e) => setAcceptedAdults(e.target.checked)}
          className={`mt-1 accent-purple-600 ${
            fieldErrors.acceptedAdults ? "ring-2 ring-red-500" : ""
          }`}
        />

        <p className="text-xs text-gray-400 leading-relaxed">
          Confirmo que todas las personas que usarán estas entradas son mayores
          de 18 años. Se podrá solicitar documentación en el acceso al evento.
        </p>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          onClick={onCancel}
          className="flex-1 bg-white/10 hover:bg-white/20 py-3 rounded-xl"
        >
          Cancelar
        </button>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 bg-purple-600 hover:bg-purple-700 py-3 rounded-xl font-medium"
        >
          {loading ? "Procesando..." : "Confirmar compra"}
        </button>
      </div>
    </div>
  );
}
