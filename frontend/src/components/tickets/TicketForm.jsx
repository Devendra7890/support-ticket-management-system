import Button from '../common/Button';
import TextField from '../forms/TextField';
import TextAreaField from '../forms/TextAreaField';
import SelectField from '../forms/SelectField';
import {
  TICKET_CATEGORY_OPTIONS,
  TICKET_PRIORITY_FORM_OPTIONS,
} from '../../utils/ticketConstants';

const TicketForm = ({
  values,
  errors,
  submitting,
  submitLabel,
  onChange,
  onSubmit,
  onCancel,
}) => (
  <form className="space-y-4" onSubmit={onSubmit} noValidate>
    <TextField
      id="title"
      label="Title"
      value={values.title}
      onChange={onChange}
      error={errors.title}
      placeholder="Brief summary of the issue"
      required
    />

    <TextAreaField
      id="description"
      label="Description"
      value={values.description}
      onChange={onChange}
      error={errors.description}
      placeholder="Describe the issue in detail"
      rows={6}
      required
      maxLength={5000}
    />

    <div className="grid gap-4 sm:grid-cols-2">
      <SelectField
        id="category"
        label="Category"
        value={values.category}
        onChange={onChange}
        options={TICKET_CATEGORY_OPTIONS}
        error={errors.category}
        required
      />

      <SelectField
        id="priority"
        label="Priority"
        value={values.priority}
        onChange={onChange}
        options={TICKET_PRIORITY_FORM_OPTIONS}
        error={errors.priority}
        required
      />
    </div>

    <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
      {onCancel ? (
        <Button type="button" variant="secondary" className="sm:w-auto" onClick={onCancel}>
          Cancel
        </Button>
      ) : null}
      <Button type="submit" className="sm:w-auto" loading={submitting}>
        {submitLabel}
      </Button>
    </div>
  </form>
);

export default TicketForm;
