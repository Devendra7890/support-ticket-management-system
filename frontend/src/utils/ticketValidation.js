export const validateTicketForm = ({ title, description, category, priority }) => {
  const errors = {};

  if (!title?.trim()) {
    errors.title = 'Title is required';
  } else if (title.trim().length < 3) {
    errors.title = 'Title must be at least 3 characters';
  } else if (title.trim().length > 200) {
    errors.title = 'Title cannot exceed 200 characters';
  }

  if (!description?.trim()) {
    errors.description = 'Description is required';
  } else if (description.trim().length < 10) {
    errors.description = 'Description must be at least 10 characters';
  } else if (description.trim().length > 5000) {
    errors.description = 'Description cannot exceed 5000 characters';
  }

  if (!category?.trim()) {
    errors.category = 'Category is required';
  }

  if (!priority) {
    errors.priority = 'Priority is required';
  }

  return errors;
};

export const validateCommentForm = (message) => {
  if (!message?.trim()) {
    return 'Comment cannot be empty';
  }
  if (message.trim().length > 2000) {
    return 'Comment cannot exceed 2000 characters';
  }
  return null;
};
