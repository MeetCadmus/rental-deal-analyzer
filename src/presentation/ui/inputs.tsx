import { useId, type ReactNode } from "react";
import { fmtGroup } from "../../domain/money";
import { useGrouped } from "./useGrouped";
import { Info } from "./primitives";
import s from "./inputs.module.css";

export function MoneyInput({
  value,
  onChange,
  label,
  sub,
  small,
  hint,
}: {
  value: number;
  onChange: (n: number) => void;
  label?: ReactNode;
  sub?: ReactNode;
  small?: boolean;
  hint?: ReactNode;
}) {
  const g = useGrouped(value, onChange, false, (v) => (v > 0 ? fmtGroup(v, false) : ""));
  const id = useId();
  return (
    <div className={s.wrap}>
      {label && (
        <label htmlFor={id} className={`${s.label}${small ? " " + s.labelSm : ""}`}>
          {label}
        </label>
      )}
      <div className={s.row}>
        <span className={`${s.affix} ${s.prefix}`}>$</span>
        <input
          id={id}
          ref={g.ref}
          type="text"
          inputMode="numeric"
          value={g.display}
          placeholder="0"
          onChange={g.onInput}
          onBlur={g.clearBuf}
          className={`${s.input} ${s.inputMoney}${small ? " " + s.inputSm : ""}`}
        />
      </div>
      {(sub || hint) && <span className={hint ? s.hint : s.sub}>{sub || hint}</span>}
    </div>
  );
}

export function RentInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const g = useGrouped(value, onChange, false, (v) => (v > 0 ? fmtGroup(v, false) : ""));
  return (
    <div className={`${s.row} ${s.rowGrow}`}>
      <span className={`${s.affix} ${s.prefixRent}`}>$</span>
      <input
        ref={g.ref}
        type="text"
        inputMode="numeric"
        value={g.display}
        placeholder="0"
        onChange={g.onInput}
        onBlur={g.clearBuf}
        className={`${s.input} ${s.inputRent}`}
      />
      <span className={`${s.affix} ${s.suffixRent}`}>/mo</span>
    </div>
  );
}

interface FieldProps {
  label?: ReactNode;
  prefix?: ReactNode;
  suffix?: ReactNode;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  sub?: ReactNode;
  disabled?: boolean;
  xs?: boolean;
  placeholder?: string;
  showZero?: boolean;
  tip?: string[];
}
export function Field({ label, prefix, suffix, value, onChange, min, max, sub, disabled, xs, placeholder, tip }: FieldProps) {
  const g = useGrouped(value, onChange, true, (v) => (v === null || v === undefined || v === 0 ? "" : fmtGroup(v, true)));
  const id = useId();
  const onBlur = () => {
    g.clearBuf();
    const n = value;
    if (min != null && n < min) onChange(min);
    else if (max != null && n > max) onChange(max);
  };
  return (
    <div className={s.wrap}>
      {label && (
        <label htmlFor={id} className={`${s.label}${xs ? " " + s.labelSm : ""} ${s.labelFlex}`}>
          {label}
          {tip && <Info lines={tip} />}
        </label>
      )}
      <div className={`${s.row}${disabled ? " " + s.rowDisabled : ""}`}>
        {prefix && <span className={`${s.affix} ${s.prefix}`}>{prefix}</span>}
        <input
          id={id}
          ref={g.ref}
          type="text"
          inputMode="decimal"
          value={g.display}
          disabled={!!disabled}
          placeholder={placeholder || "0"}
          onChange={g.onInput}
          onBlur={onBlur}
          className={`${s.input}${xs ? " " + s.inputXs : ""}`}
        />
        {suffix && <span className={`${s.affix} ${s.suffix}`}>{suffix}</span>}
      </div>
      {sub && <span className={s.sub}>{sub}</span>}
    </div>
  );
}
