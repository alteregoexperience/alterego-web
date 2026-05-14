"use client";

import { useEffect, useState } from "react";
import { PurchaseBuyer } from "@/types/Ticket";

type Props = {
  loading: boolean;
  ticketsCount: number;
  onSubmit: (buyer: PurchaseBuyer, attendeeNames: string[]) => void;
  onCancel: () => void;
};

export default function CheckoutForm({
  loading,
  ticketsCount,
  onSubmit,
  onCancel,
}: Props) {
  const [buyer, setBuyer] = useState<PurchaseBuyer>({
    name: "",
    birthdate: "",
    email: "",
    phone: "",
  });
  const [additionalAttendeeNames, setAdditionalAttendeeNames] = useState<
    string[]
  >([]);
  const [acceptedAdults, setAcceptedAdults] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const additionalAttendeesCount = Math.max(0, ticketsCount - 1);

    setAdditionalAttendeeNames((prev) =>
      Array.from(
        { length: additionalAttendeesCount },
        (_, index) => prev[index] ?? "",
      ),
    );
  }, [ticketsCount]);

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

    const buyerName = buyer.name.trim().replace(/\s+/g, " ");
    const normalizedAdditionalNames = additionalAttendeeNames.map((name) =>
      name.trim().replace(/\s+/g, " "),
    );

    if (!buyerName) errors.name = true;
    if (!buyer.birthdate) errors.birthdate = true;

    if (!buyer.email || !isValidEmail(buyer.email)) errors.email = true;

    if (!confirmEmail || buyer.email !== confirmEmail)
      errors.confirmEmail = true;

    if (!buyer.phone || !isValidPhone(buyer.phone)) errors.phone = true;

    if (!acceptedAdults) errors.acceptedAdults = true;

    normalizedAdditionalNames.forEach((name, index) => {
      if (!name) errors[`attendee-${index}`] = true;
    });

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setError("Revisa los campos marcados");
      return;
    }

    setError("");
    onSubmit(
      {
        ...buyer,
        name: buyerName,
        email: buyer.email.trim(),
        phone: buyer.phone.trim(),
      },
      [buyerName, ...normalizedAdditionalNames],
    );
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
            disabled={loading}
            onChange={(e) => {
              setBuyer({ ...buyer, name: e.target.value });
              setFieldErrors((prev) => ({ ...prev, name: false }));
            }}
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
            disabled={loading}
            onChange={(e) => {
              setBuyer({ ...buyer, birthdate: e.target.value });
              setFieldErrors((prev) => ({ ...prev, birthdate: false }));
            }}
          />
        </div>

        <div>
          <label className="text-xs text-gray-400 block mb-1">Email</label>
          <input
            type="email"
            placeholder="nombre@email.com"
            className={inputClass("email")}
            value={buyer.email}
            disabled={loading}
            onChange={(e) => {
              setBuyer({ ...buyer, email: e.target.value });
              setFieldErrors((prev) => ({ ...prev, email: false }));
            }}
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
            value={confirmEmail}
            disabled={loading}
            onChange={(e) => {
              setConfirmEmail(e.target.value);
              setFieldErrors((prev) => ({ ...prev, confirmEmail: false }));
            }}
            onPaste={blockPaste}
          />
        </div>

        <div>
          <label className="text-xs text-gray-400 block mb-1">Teléfono</label>
          <input
            placeholder="Ej: 600123123"
            className={inputClass("phone")}
            value={buyer.phone}
            disabled={loading}
            onChange={(e) => {
              setBuyer({ ...buyer, phone: e.target.value });
              setFieldErrors((prev) => ({ ...prev, phone: false }));
            }}
          />
        </div>
      </div>

      {ticketsCount > 1 && (
        <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div>
            <h4 className="text-sm tracking-[0.2em] text-gray-400">
              ASISTENTES
            </h4>
            <p className="mt-1 text-xs leading-5 text-gray-500">
              El comprador cuenta como asistente 1. Rellena el resto de
              asistentes.
            </p>
          </div>

          {additionalAttendeeNames.map((attendeeName, index) => (
            <div key={index}>
              <label className="text-xs text-gray-400 block mb-1">
                Asistente {index + 2}
              </label>
              <input
                placeholder="Nombre y apellidos del asistente"
                className={inputClass(`attendee-${index}`)}
                value={attendeeName}
                disabled={loading}
                onChange={(e) => {
                  const nextNames = [...additionalAttendeeNames];
                  nextNames[index] = e.target.value;
                  setAdditionalAttendeeNames(nextNames);
                  setFieldErrors((prev) => ({
                    ...prev,
                    [`attendee-${index}`]: false,
                  }));
                }}
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex items-start gap-3 pt-2">
        <input
          type="checkbox"
          checked={acceptedAdults}
          disabled={loading}
          onChange={(e) => {
            setAcceptedAdults(e.target.checked);
            setFieldErrors((prev) => ({ ...prev, acceptedAdults: false }));
          }}
          className={`mt-1 accent-purple-600 ${
            fieldErrors.acceptedAdults ? "ring-2 ring-red-500" : ""
          }`}
        />

        <p className="text-xs text-gray-400 leading-relaxed">
          Confirmo que todas las personas que usarán estas entradas son mayores
          de 18 años. Se solicitará documentación en el acceso al evento.
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
          className={`
  flex-1 py-3 rounded-xl font-medium
  ${
    loading
      ? "bg-purple-600 opacity-70 cursor-not-allowed"
      : "bg-purple-600 bg-purple-600"
  }
`}
        >
          {loading ? "Procesando..." : "Confirmar compra"}
        </button>
      </div>
    </div>
  );
}
