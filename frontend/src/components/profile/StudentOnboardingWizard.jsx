import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Loader2,
  Sparkles,
} from 'lucide-react';
import {
  INITIAL_ONBOARDING_STATE,
  ONBOARDING_QUESTIONS,
  isQuestionAnswered,
  normalizeOnboardingState,
} from '../../constants/onboardingQuestions';

export default function StudentOnboardingWizard({
  initialAnswers,
  isEditing = false,
  submitting = false,
  serverError = '',
  onSubmit,
  onCancel,
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState(() =>
    initialAnswers ? normalizeOnboardingState(initialAnswers) : INITIAL_ONBOARDING_STATE
  );
  const [stepError, setStepError] = useState('');
  const stepHeadingRef = useRef(null);

  const totalSteps = ONBOARDING_QUESTIONS.length;
  const currentQuestion = ONBOARDING_QUESTIONS[stepIndex];
  const isLastStep = stepIndex === totalSteps - 1;

  useEffect(() => {
    stepHeadingRef.current?.focus();
  }, [stepIndex]);

  const toggleMultiOption = (fieldId, option) => {
    setStepError('');
    setAnswers((prev) => {
      const current = Array.isArray(prev[fieldId]) ? prev[fieldId] : [];
      const exists = current.includes(option);
      const nextValues = exists
        ? current.filter((item) => item !== option)
        : [...current, option];
      return {
        ...prev,
        [fieldId]: nextValues,
      };
    });
  };

  const selectSingleOption = (fieldId, option) => {
    setStepError('');
    setAnswers((prev) => ({
      ...prev,
      [fieldId]: option,
    }));
  };

  const handleOtherTextChange = (otherField, value) => {
    setAnswers((prev) => ({
      ...prev,
      [otherField]: value,
    }));
  };

  const handleNext = () => {
    if (!isQuestionAnswered(currentQuestion, answers)) {
      setStepError(
        currentQuestion.type === 'multi'
          ? 'Please select at least one option before continuing.'
          : 'Please select an option before continuing.'
      );
      return;
    }
    setStepError('');
    setStepIndex((prev) => Math.min(prev + 1, totalSteps - 1));
  };

  const handlePrevious = () => {
    setStepError('');
    setStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    if (!isQuestionAnswered(currentQuestion, answers)) {
      setStepError(
        currentQuestion.type === 'multi'
          ? 'Please select at least one option to complete your profile.'
          : 'Please select an option to complete your profile.'
      );
      return;
    }

    const firstUnansweredIndex = ONBOARDING_QUESTIONS.findIndex(
      (question) => !isQuestionAnswered(question, answers)
    );
    if (firstUnansweredIndex !== -1) {
      setStepIndex(firstUnansweredIndex);
      setStepError('Please answer this required question before submitting.');
      return;
    }

    setStepError('');
    await onSubmit(answers);
  };

  const selectedValues = answers[currentQuestion.id];
  const showOtherInput =
    currentQuestion.otherField &&
    Array.isArray(selectedValues) &&
    selectedValues.includes('Other');

  const displayError = stepError || serverError;

  return (
    <section
      className="card onboarding-wizard-card"
      aria-labelledby="onboarding-wizard-title"
    >
      <div className="onboarding-wizard-header">
        <div>
          <div className="onboarding-step-pill">
            <Sparkles size={13} aria-hidden="true" />
            <span>
              {isEditing ? 'Update Profile Preferences' : 'Student Profile Setup'} •{' '}
              <strong>
                {stepIndex + 1}/{totalSteps}
              </strong>
            </span>
          </div>
          <h2 id="onboarding-wizard-title" className="onboarding-wizard-title">
            {isEditing
              ? 'Edit Your Questionnaire Answers'
              : 'Complete Your Student Profile'}
          </h2>
        </div>

        <span className="onboarding-progress-count" aria-live="polite">
          Step {stepIndex + 1} of {totalSteps}
        </span>
      </div>

      <div className="onboarding-progress-wrap">
        <progress
          className="onboarding-progress-bar"
          max={totalSteps}
          value={stepIndex + 1}
          aria-label={`Onboarding question ${stepIndex + 1} of ${totalSteps}`}
        />
      </div>

      {displayError && (
        <div className="auth-alert is-error" role="alert">
          <AlertCircle size={18} aria-hidden="true" />
          <span>{displayError}</span>
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="onboarding-form" noValidate>
        <fieldset className="onboarding-fieldset">
          <legend
            ref={stepHeadingRef}
            tabIndex={-1}
            className="onboarding-question-title"
          >
            Q{currentQuestion.stepNumber}. {currentQuestion.question}
          </legend>
          <p className="onboarding-question-hint">
            {currentQuestion.hint}{' '}
            <span className="onboarding-selection-mode">
              ({currentQuestion.type === 'multi' ? 'Multiple selections allowed' : 'Select one'})
            </span>
          </p>

          <div
            className={`onboarding-options-grid ${
              currentQuestion.type === 'single' ? 'is-single' : ''
            }`}
          >
            {currentQuestion.options.map((option) => {
              const isChecked =
                currentQuestion.type === 'multi'
                  ? Array.isArray(selectedValues) && selectedValues.includes(option)
                  : selectedValues === option;

              const inputId = `q-${currentQuestion.id}-${option
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')}`;

              return (
                <label
                  key={option}
                  htmlFor={inputId}
                  className={`onboarding-option-card ${isChecked ? 'is-selected' : ''}`}
                >
                  <input
                    id={inputId}
                    name={currentQuestion.id}
                    type={currentQuestion.type === 'multi' ? 'checkbox' : 'radio'}
                    value={option}
                    checked={isChecked}
                    onChange={() =>
                      currentQuestion.type === 'multi'
                        ? toggleMultiOption(currentQuestion.id, option)
                        : selectSingleOption(currentQuestion.id, option)
                    }
                    className="onboarding-option-input"
                  />
                  <span className="onboarding-option-check" aria-hidden="true">
                    {isChecked && <Check size={13} />}
                  </span>
                  <span className="onboarding-option-label">{option}</span>
                </label>
              );
            })}
          </div>

          {showOtherInput && (
            <div className="form-field onboarding-other-field">
              <label
                htmlFor={`other-${currentQuestion.id}`}
                className="form-label"
              >
                Specify Other (optional)
              </label>
              <input
                id={`other-${currentQuestion.id}`}
                type="text"
                className="form-input"
                maxLength={80}
                placeholder={currentQuestion.otherPlaceholder}
                value={answers[currentQuestion.otherField] || ''}
                onChange={(e) =>
                  handleOtherTextChange(currentQuestion.otherField, e.target.value)
                }
              />
            </div>
          )}
        </fieldset>

        <div className="onboarding-actions">
          <div className="onboarding-actions-left">
            {stepIndex > 0 && (
              <button
                type="button"
                className="btn-secondary"
                onClick={handlePrevious}
                disabled={submitting}
              >
                <ArrowLeft size={15} aria-hidden="true" />
                <span>Previous</span>
              </button>
            )}
            {onCancel && (
              <button
                type="button"
                className="btn-ghost-neutral"
                onClick={onCancel}
                disabled={submitting}
              >
                Cancel
              </button>
            )}
          </div>

          {!isLastStep ? (
            <button
              type="button"
              className="btn-primary"
              onClick={handleNext}
              disabled={submitting}
            >
              <span>Next Question</span>
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          ) : (
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 size={15} className="spin-icon" aria-hidden="true" />
              ) : (
                <CheckCircle2 size={15} aria-hidden="true" />
              )}
              <span>
                {submitting
                  ? 'Saving Profile...'
                  : isEditing
                    ? 'Save Updated Answers'
                    : 'Complete Profile'}
              </span>
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
