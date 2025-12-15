// Brisa web component (hydrated by Brisa runtime)
import type { WebContext } from 'brisa';

interface Guess {
  number: number;
  value: string;
  correctDigits: number;
  squared: number;
}

const validNumberPattern = /^[+-]?\d*\.?\d+$|^[+-]?\d+\.?\d*$/;

function generateRandomTarget(): number {
  return Math.floor(Math.random() * 201) + 50;
}

function generateInitialGuess(target: number): string {
  const sqrtValue = Math.sqrt(Math.abs(target));
  const integerPart = Math.floor(sqrtValue);
  return `${integerPart}.`;
}

function getGuessClass(precision: number, correctDigits: number): string {
  const diff = precision - correctDigits;
  if (diff <= 0) return 'correct';
  if (diff === 1) return 'very-close';
  if (diff === 2) return 'close';
  return 'far';
}

// Uses Brisa's state() for reactivity instead of Angular signals/bindings
export default function SquareGame(_: unknown, { state }: WebContext) {
  const targetNumber = state<number>(generateRandomTarget()); // displayed target number
  const precision = state<number>(5); // decimal precision to guess
  const currentGuess = state<string>(generateInitialGuess(targetNumber.value)); // current input guess
  const guesses = state<Guess[]>([]); // log of previous guesses
  const guessCount = state(0); // number of guesses made

  const getActualRoot = () => Math.sqrt(Math.abs(targetNumber.value));

  const isValidNumber = (str: string) =>
    Boolean(str) &&
    str !== '.' &&
    str !== '-' &&
    str !== '+' &&
    str !== '-.' &&
    validNumberPattern.test(str);

  const countCorrectDigits = (guessVal: number) => {
    if (isNaN(guessVal) || !isFinite(guessVal) || guessVal < 0) return 0;

    const typedDecimals = currentGuess.value.split('.')[1] || '';
    const actualDec = getActualRoot().toFixed(10).split('.')[1];

    let correct = 0;
    for (let i = 0; i < typedDecimals.length; i++) {
      if (typedDecimals[i] === actualDec[i]) {
        correct++;
      } else {
        break;
      }
    }
    return correct;
  };

  const submit = () => {
    guessCount.value++;

    let guessValue: number;
    if (!isValidNumber(currentGuess.value)) {
      guessValue = NaN;
    } else {
      guessValue = parseFloat(currentGuess.value);
      if (isNaN(guessValue)) {
        guessValue = NaN;
      }
    }

    const correctDigits = countCorrectDigits(guessValue);
    const squareOfGuess = isNaN(guessValue) ? NaN : guessValue * guessValue;

    const newGuess: Guess = {
      number: guessCount.value,
      value: currentGuess.value,
      correctDigits,
      squared: squareOfGuess,
    };

    guesses.value = [...guesses.value, newGuess]; // trigger reactivity
  };

  const pickNewTarget = () => {
    const newTarget = generateRandomTarget();
    targetNumber.value = newTarget;
    guesses.value = [];
    currentGuess.value = generateInitialGuess(newTarget);
    guessCount.value = 0; // reset guess count
  };

  return (
    <div class="game-card">
      <h1>Square root guessing game :0</h1>

      <p class="description">
        Guess the square root of{' '}
        <input
          type="text"
          value={targetNumber.value}
          onInput={(event: Event) => {
            const value = (event.target as HTMLInputElement).value;
            const parsed = parseFloat(value);
            if (!isNaN(parsed)) {
              targetNumber.value = parsed;
            }
          }}
        />{' '}
        to{' '}
        <input
          type="text"
          value={precision.value}
          onInput={(event: Event) => {
            const next = parseInt((event.target as HTMLInputElement).value, 10);
            if (!isNaN(next) && next >= 0) {
              precision.value = next;
            }
          }}
        />{' '}
        correct digits after the decimal place.
      </p>

      <button class="primary" onClick={pickNewTarget}>
        Pick a new target number
      </button>

      <div class="guess-input">
        <label for="guess">Enter your guess:</label>
        <input
          id="guess"
          type="text"
          value={currentGuess.value}
          onInput={(event: Event) => (currentGuess.value = (event.target as HTMLInputElement).value)}
          onKeyUp={(event: KeyboardEvent) => {
            if (event.key === 'Enter') submit();
          }}
        />
      </div>

      {guesses.value.length > 0 && (
        <div class="guess-list">
          {guesses.value
            .slice()
            .reverse()
            .map((guess) => (
              <div
                class={['guess-item', getGuessClass(precision.value, guess.correctDigits)].join(' ')}
              >
                Guess {guess.number} ({guess.value}) You have{' '}
                {guess.correctDigits} digits after the decimal correct. The
                square of your guess is {Number.isNaN(guess.squared) ? 'NaN' : guess.squared}.
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
