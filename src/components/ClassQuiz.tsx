import { useEffect, useRef, useState } from "react";
import { CLASSES } from "../data/classes";
import { QUIZ, SPECS } from "../data/quiz";
import type { WowClass } from "../data/types";
import { type Answers, type ClassMatch, recommendClasses } from "../lib/quiz";
import { Icon } from "./Icon";

interface Props {
  open: boolean;
  onClose: () => void;
  onChoose: (cls: WowClass, treeIndex: number) => void;
}

const RUNNERS_UP = 2;

/** Modal questionnaire that ranks classes by playstyle and opens the best match in the calculator. */
export function ClassQuiz({ open, onClose, onChoose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  const restart = () => {
    setAnswers({});
    setStep(0);
  };

  const answer = (questionId: string, optionId: string) => {
    setAnswers((a) => ({ ...a, [questionId]: optionId }));
    setStep((s) => s + 1);
  };

  const done = step >= QUIZ.length;
  const question = QUIZ[step];
  const [best, ...others] = done ? recommendClasses(CLASSES, SPECS, QUIZ, answers) : [];

  return (
    <dialog ref={dialog} className="quiz" aria-labelledby="quiz-title" onClose={onClose}>
      <header className="quiz-header">
        <h2 id="quiz-title">Find your class</h2>
        <button className="quiz-close" onClick={onClose} aria-label="Close quiz">
          ×
        </button>
      </header>

      {!done ? (
        <>
          <div className="quiz-progress">
            <span>
              Question {step + 1} of {QUIZ.length}
            </span>
            <progress value={step} max={QUIZ.length} aria-hidden="true" />
          </div>
          <fieldset className="quiz-question" key={question.id}>
            <legend>{question.prompt}</legend>
            {question.options.map((o) => (
              <button
                key={o.id}
                className="quiz-option"
                aria-pressed={answers[question.id] === o.id}
                onClick={() => answer(question.id, o.id)}
              >
                {o.label}
              </button>
            ))}
          </fieldset>
          <div className="quiz-nav">
            <button className="link-button" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
              Back
            </button>
          </div>
        </>
      ) : best ? (
        <div className="quiz-results">
          <p className="quiz-eyebrow">Your best match</p>
          <Result match={best} primary onChoose={onChoose} />
          {others.length > 0 && <p className="quiz-eyebrow">Also worth a look</p>}
          {others.slice(0, RUNNERS_UP).map((m) => (
            <Result key={m.cls.id} match={m} onChoose={onChoose} />
          ))}
          <div className="quiz-nav">
            <button className="link-button" onClick={() => setStep((s) => s - 1)}>
              Back
            </button>
            <button className="link-button" onClick={restart}>
              Retake quiz
            </button>
          </div>
        </div>
      ) : (
        <p className="empty">No class data loaded.</p>
      )}
    </dialog>
  );
}

function Result({
  match,
  primary = false,
  onChoose,
}: {
  match: ClassMatch;
  primary?: boolean;
  onChoose: Props["onChoose"];
}) {
  const { cls, treeIndex, percent, reasons } = match;
  const tree = cls.trees[treeIndex];
  return (
    <article
      className={`quiz-result ${primary ? "primary" : ""}`}
      style={{ "--class-color": cls.color } as React.CSSProperties}
      aria-label={`${cls.name}, ${tree.name}, ${percent}% match`}
    >
      <Icon name={cls.icon ?? `classicon_${cls.id}`} label={cls.name} size={primary ? 56 : 40} className="round" />
      <div className="quiz-result-body">
        <h3>
          {cls.name} <span className="quiz-spec">· {tree.name}</span>
        </h3>
        <p className="quiz-percent">{percent}% match</p>
        {primary && reasons.length > 0 && (
          <ul className="quiz-reasons">
            {reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        )}
      </div>
      <button className="quiz-open" onClick={() => onChoose(cls, treeIndex)}>
        Open {cls.name} talents
      </button>
    </article>
  );
}
