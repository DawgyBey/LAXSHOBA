import { useId } from 'react';

// Label + input pair using the site's `.field` styling.
//   <Field label="Name" value={v} onChange={...} error="Name is required." hint="As on your ID" />
//   <Field label="Notes" as="textarea" ... />
//   <Field label="Category" as="select" ...><option/>...</Field>
// `className` lands on the wrapper, so variants like `.field-narrow` are opted
// into rather than restated as inline widths at every call site.
// `error` marks the input invalid and announces the message to screen readers.
export default function Field({ label, as: Tag = 'input', className, style, children, error, hint, ...props }) {
  const id = useId();
  const noteId = `${id}-note`;
  const describedBy = error || hint ? noteId : undefined;
  return (
    <div className={className ? `field ${className}` : 'field'} style={style}>
      <label htmlFor={id}>{label}</label>
      <Tag id={id} aria-invalid={error ? true : undefined} aria-describedby={describedBy} {...props}>{children}</Tag>
      {error
        ? <p className="field-error" id={noteId} role="alert">{error}</p>
        : hint ? <p className="field-hint" id={noteId}>{hint}</p> : null}
    </div>
  );
}
