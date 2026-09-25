import { useId } from 'react';

// Label + input pair using the site's `.field` styling.
//   <Field label="Name" value={v} onChange={...} />
//   <Field label="Notes" as="textarea" ... />
//   <Field label="Category" as="select" ...><option/>...</Field>
export default function Field({ label, as: Tag = 'input', style, children, ...props }) {
  const id = useId();
  return (
    <div className="field" style={style}>
      <label htmlFor={id}>{label}</label>
      <Tag id={id} {...props}>{children}</Tag>
    </div>
  );
}
