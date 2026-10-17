import { useId } from 'react';

// Label + input pair using the site's `.field` styling.
//   <Field label="Name" value={v} onChange={...} />
//   <Field label="Notes" as="textarea" ... />
//   <Field label="Category" as="select" ...><option/>...</Field>
// `className` lands on the wrapper, so variants like `.field-narrow` are opted
// into rather than restated as inline widths at every call site.
export default function Field({ label, as: Tag = 'input', className, style, children, ...props }) {
  const id = useId();
  return (
    <div className={className ? `field ${className}` : 'field'} style={style}>
      <label htmlFor={id}>{label}</label>
      <Tag id={id} {...props}>{children}</Tag>
    </div>
  );
}
