import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import TicketForm from '../../components/tickets/TicketForm';
import * as ticketService from '../../services/ticketService';
import { getErrorMessage } from '../../utils/errorMessage';
import { validateTicketForm } from '../../utils/ticketValidation';
import { TICKET_PRIORITIES } from '../../utils/ticketConstants';

const CreateTicketPage = () => {
  const navigate = useNavigate();
  const [values, setValues] = useState({
    title: '',
    description: '',
    category: 'Technical',
    priority: TICKET_PRIORITIES.MEDIUM,
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validateTicketForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const response = await ticketService.createTicket({
        title: values.title.trim(),
        description: values.description.trim(),
        category: values.category,
        priority: values.priority,
      });
      toast.success('Ticket created successfully');
      navigate(`/app/tickets/${response.data.ticket._id}`);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to create ticket.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--stm-accent)]">
          Create
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--stm-ink)]">
          Create Ticket
        </h1>
        <p className="mt-2 text-[var(--stm-muted)]">
          Submit a new support request. Status is set to Open automatically.
        </p>
      </div>

      <section className="rounded-3xl border border-[var(--stm-border)] bg-white p-5 sm:p-6">
        <TicketForm
          values={values}
          errors={errors}
          submitting={submitting}
          submitLabel={submitting ? 'Creating...' : 'Create ticket'}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/app/tickets')}
        />
      </section>
    </div>
  );
};

export default CreateTicketPage;
