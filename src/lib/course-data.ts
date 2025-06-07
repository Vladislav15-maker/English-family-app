import type { Unit, Word, VocabRound, GrammarQuestion, GrammarRound } from '@/types';

const createWord = (id: string, english: string, russian: string, transcription: string): Word => ({ id, english, russian, transcription });
const createGrammarQuestion = (id: string, question: string, correctAnswer: string, questionType: GrammarQuestionType, options?: string[], exampleTransformation?: string): GrammarQuestion => ({ id, question, correctAnswer, questionType, options, exampleTransformation });

// Helper to get date strings for unlockDate
const getUnlockDate = (daysFromToday: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  date.setHours(0, 0, 0, 0); // Set to start of the day for daily unlock logic
  return date;
};

export const courseUnits: Unit[] = [
  // Unit 1
  {
    id: 'unit-1',
    unitNumber: 1,
    title: 'Unit 1',
    description: 'Greetings',
    isLocked: false, 
    unlockDate: new Date(new Date().setDate(new Date().getDate() -1)), // Ensures it's always unlocked
    imagePlaceholder: 'greetings people',
    vocabulary: [
      {
        id: 'unit-1-vocab-1',
        title: 'Раунд 1',
        words: [
          createWord('u1v1w1', 'hi', 'привет', '[хай]'),
          createWord('u1v1w2', 'hello', 'здравствуйте', '[хэлоу]'),
          createWord('u1v1w3', 'goodbye', 'до свидания', '[гудбай]'),
          createWord('u1v1w4', 'good morning', 'доброе утро', '[гуд морнинг]'),
          createWord('u1v1w5', 'good night', 'спокойной ночи', '[гуд найт]'),
        ],
      },
      {
        id: 'unit-1-vocab-2',
        title: 'Раунд 2',
        words: [
          createWord('u1v2w1', 'how are you', 'как дела', '[хау ар ю]'),
          createWord('u1v2w2', "I'm fine", 'у меня все хорошо', '[айм файн]'),
          createWord('u1v2w3', 'nice to meet you', 'приятно познакомиться', '[найс ту мит ю]'),
          createWord('u1v2w4', 'see you', 'увидимся', '[си ю]'),
          createWord('u1v2w5', 'take care', 'береги себя', '[тэйк кэр]'),
        ],
      },
    ],
    grammar: [
      {
        id: 'unit-1-grammar-1',
        title: 'Раунд 1: To be (am, is, are) - Выбери правильный ответ',
        questions: [
          createGrammarQuestion('u1g1q1', 'I ___ a student.', 'am', 'multiple-choice', ['am', 'is', 'are']),
          createGrammarQuestion('u1g1q2', 'She ___ happy.', 'is', 'multiple-choice', ['am', 'is', 'are']),
          createGrammarQuestion('u1g1q3', 'They ___ friends.', 'are', 'multiple-choice', ['am', 'is', 'are']),
          createGrammarQuestion('u1g1q4', 'We ___ from Russia.', 'are', 'multiple-choice', ['am', 'is', 'are']),
          createGrammarQuestion('u1g1q5', 'It ___ a dog.', 'is', 'multiple-choice', ['am', 'is', 'are']),
        ],
      },
      {
        id: 'unit-1-grammar-2',
        title: 'Раунд 2: To be (am, is, are) - Впиши правильную форму',
        questions: [
          createGrammarQuestion('u1g2q1', 'I ___ at home.', 'am', 'fill-in-the-blank'),
          createGrammarQuestion('u1g2q2', 'You ___ my friend.', 'are', 'fill-in-the-blank'),
          createGrammarQuestion('u1g2q3', 'He ___ my brother.', 'is', 'fill-in-the-blank'),
          createGrammarQuestion('u1g2q4', 'We ___ here.', 'are', 'fill-in-the-blank'),
          createGrammarQuestion('u1g2q5', 'It ___ sunny.', 'is', 'fill-in-the-blank'),
        ],
      },
      {
        id: 'unit-1-grammar-3',
        title: 'Раунд 3: To be (am, is, are) - Сделай отрицательную форму',
        questions: [
          createGrammarQuestion('u1g3q1', 'I am a teacher.', 'I am not a teacher.', 'transform'),
          createGrammarQuestion('u1g3q2', 'She is at work.', 'She is not at work.', 'transform'),
          createGrammarQuestion('u1g3q3', 'They are friends.', 'They are not friends.', 'transform'),
          createGrammarQuestion('u1g3q4', 'We are ready.', 'We are not ready.', 'transform'),
          createGrammarQuestion('u1g3q5', 'It is cold.', 'It is not cold.', 'transform'),
        ],
      },
    ],
  },
  // Unit 2
  {
    id: 'unit-2',
    unitNumber: 2,
    title: 'Unit 2',
    description: 'Family',
    isLocked: true, 
    unlockDate: getUnlockDate(1), // Откроется на следующий день
    imagePlaceholder: 'family home',
    vocabulary: [
      {
        id: 'unit-2-vocab-1',
        title: 'Раунд 1',
        words: [
          createWord('u2v1w1', 'mother', 'мама', '[мазэр]'),
          createWord('u2v1w2', 'father', 'папа', '[фазэр]'),
          createWord('u2v1w3', 'sister', 'сестра', '[систэр]'),
          createWord('u2v1w4', 'brother', 'брат', '[бразэр]'),
          createWord('u2v1w5', 'parents', 'родители', '[пэрентс]'),
        ],
      },
      {
        id: 'unit-2-vocab-2',
        title: 'Раунд 2',
        words: [
          createWord('u2v2w1', 'grandmother', 'бабушка', '[грэндмазэр]'),
          createWord('u2v2w2', 'grandfather', 'дедушка', '[грэндфазэр]'),
          createWord('u2v2w3', 'uncle', 'дядя', '[анкл]'),
          createWord('u2v2w4', 'aunt', 'тётя', '[ант]'),
          createWord('u2v2w5', 'cousin', 'двоюродный брат/сестра', '[казн]'),
        ],
      },
    ],
    grammar: [
      {
        id: 'unit-2-grammar-1',
        title: 'Раунд 1: Present Simple (утвердительные) - Выбери правильный ответ',
        questions: [
          createGrammarQuestion('u2g1q1', 'He ___ to school every day.', 'goes', 'multiple-choice', ['go', 'goes', 'going']),
          createGrammarQuestion('u2g1q2', 'I ___ English.', 'study', 'multiple-choice', ['study', 'studies', 'studying']),
          createGrammarQuestion('u2g1q3', 'She ___ tea.', 'drinks', 'multiple-choice', ['drink', 'drinks', 'drinking']),
          createGrammarQuestion('u2g1q4', 'We ___ in a house.', 'live', 'multiple-choice', ['live', 'lives', 'living']),
          createGrammarQuestion('u2g1q5', 'They ___ soccer.', 'play', 'multiple-choice', ['play', 'plays', 'playing']),
        ],
      },
      {
        id: 'unit-2-grammar-2',
        title: 'Раунд 2: Present Simple (утвердительные) - Впиши правильную форму глагола',
        questions: [
          createGrammarQuestion('u2g2q1', 'He (like) ___ music.', 'likes', 'fill-in-the-blank'),
          createGrammarQuestion('u2g2q2', 'I (read) ___ books.', 'read', 'fill-in-the-blank'),
          createGrammarQuestion('u2g2q3', 'She (cook) ___ dinner.', 'cooks', 'fill-in-the-blank'),
          createGrammarQuestion('u2g2q4', 'We (have) ___ a cat.', 'have', 'fill-in-the-blank'),
          createGrammarQuestion('u2g2q5', 'They (work) ___ here.', 'work', 'fill-in-the-blank'),
        ],
      },
      {
        id: 'unit-2-grammar-3',
        title: 'Раунд 3: Present Simple (отрицательные) - Сделай отрицательную форму',
        questions: [
          createGrammarQuestion('u2g3q1', 'I like pizza.', "I don't like pizza.", 'transform'),
          createGrammarQuestion('u2g3q2', 'He plays tennis.', "He doesn't play tennis.", 'transform'),
          createGrammarQuestion('u2g3q3', 'She cooks well.', "She doesn't cook well.", 'transform'),
          createGrammarQuestion('u2g3q4', 'We read books.', "We don't read books.", 'transform'),
          createGrammarQuestion('u2g3q5', 'They work here.', "They don't work here.", 'transform'),
        ],
      },
    ],
  },
  // Unit 3
  {
    id: 'unit-3',
    unitNumber: 3,
    title: 'Unit 3',
    description: 'Food',
    isLocked: true, 
    unlockDate: getUnlockDate(2), 
    imagePlaceholder: 'food fruit',
    vocabulary: [
      { id: 'u3v1', title: 'Раунд 1', words: [
        createWord('u3v1w1', 'bread', 'хлеб', '[брэд]'),
        createWord('u3v1w2', 'milk', 'молоко', '[милк]'),
        createWord('u3v1w3', 'water', 'вода', '[уотэр]'),
        createWord('u3v1w4', 'juice', 'сок', '[джус]'),
        createWord('u3v1w5', 'apple', 'яблоко', '[эпл]'),
      ]},
      { id: 'u3v2', title: 'Раунд 2', words: [
        createWord('u3v2w1', 'tea', 'чай', '[ти]'),
        createWord('u3v2w2', 'coffee', 'кофе', '[кофи]'),
        createWord('u3v2w3', 'orange', 'апельсин', '[ориндж]'),
        createWord('u3v2w4', 'banana', 'банан', '[бэнэнэ]'),
        createWord('u3v2w5', 'salad', 'салат', '[сэлэд]'),
      ]},
    ],
    grammar: [
      { id: 'u3g1', title: 'Раунд 1: There is / There are - Выбери правильный ответ', questions: [
        createGrammarQuestion('u3g1q1', 'There ___ a book on the table.', 'is', 'multiple-choice', ['is', 'are']),
        createGrammarQuestion('u3g1q2', 'There ___ two chairs.', 'are', 'multiple-choice', ['is', 'are']),
      ]},
    ],
  },
];

// Populate remaining units
const unitTopics: Record<number, { description: string, imageHint: string }> = {
    4: { description: "Numbers", imageHint: "numbers count" },
    5: { description: "Colors", imageHint: "colors palette" },
    6: { description: "School", imageHint: "school classroom" },
    7: { description: "House", imageHint: "house room" },
    8: { description: "Weather", imageHint: "weather forecast" },
    9: { description: "Days of the week", imageHint: "calendar days" },
    10: { description: "Hobbies", imageHint: "hobbies leisure" },
};

for (let i = 4; i <= 10; i++) {
  courseUnits.push({
    id: `unit-${i}`,
    unitNumber: i,
    title: `Unit ${i}`,
    description: unitTopics[i]?.description || `Topic for Unit ${i}`,
    isLocked: true, 
    unlockDate: getUnlockDate(i - 1), 
    imagePlaceholder: unitTopics[i]?.imageHint || "placeholder image",
    vocabulary: [
      { id: `u${i}v1`, title: 'Раунд 1', words: [createWord(`u${i}v1w1`, `word${i}-1`, `слово${i}-1`, `[transcription${i}-1]`)] },
      { id: `u${i}v2`, title: 'Раунд 2', words: [createWord(`u${i}v2w1`, `word${i}-6`, `слово${i}-6`, `[transcription${i}-6]`)] },
    ],
    grammar: [
      { id: `u${i}g1`, title: 'Раунд 1', questions: [createGrammarQuestion(`u${i}g1q1`, `Question ${i}.1?`, 'Answer', 'multiple-choice', ['Option A', 'Option B'])] },
      { id: `u${i}g2`, title: 'Раунд 2', questions: [createGrammarQuestion(`u${i}g2q1`, `Question ${i}.2 ___ .`, 'FillIn', 'fill-in-the-blank')] },
      { id: `u${i}g3`, title: 'Раунд 3', questions: [createGrammarQuestion(`u${i}g3q1`, `Transform this sentence ${i}.`, 'Transformed sentence.', 'transform')] },
    ],
  });
}

// Function to get a specific unit, handling potential undefined
export const getUnitById = (unitId: string): Unit | undefined => {
  return courseUnits.find(unit => unit.id === unitId);
};

// Function to get a specific vocabulary round
export const getVocabRoundById = (unitId: string, roundId: string): VocabRound | undefined => {
  const unit = getUnitById(unitId);
  return unit?.vocabulary.find(vr => vr.id === roundId);
};

// Function to get a specific grammar round
export const getGrammarRoundById = (unitId: string, roundId: string): GrammarRound | undefined => {
  const unit = getUnitById(unitId);
  return unit?.grammar.find(gr => gr.id === roundId);
