import prisma from '../config/db';

async function seedMockTests() {
  console.log('Seeding mock tests...');

  // Create Physics Test
  const physicsTest = await prisma.mockTest.upsert({
    where: { id: 'physics-mechanics-test-1' },
    update: {},
    create: {
      id: 'physics-mechanics-test-1',
      title: 'Physics - Mechanics Fundamentals',
      subject: 'Physics',
      examType: 'JEE',
      totalMarks: 20,
      durationMinutes: 30,
      description: 'Test your understanding of basic mechanics concepts',
      difficulty: 'Medium',
      questions: {
        create: [
          {
            questionText: 'What is the SI unit of force?',
            options: { A: 'Joule', B: 'Newton', C: 'Watt', D: 'Pascal' },
            correctAnswer: 'B',
            topic: 'Units and Measurements',
            difficulty: 'Easy',
            explanation: 'Force is measured in Newtons (N) in the SI system.',
            marks: 2,
          },
          {
            questionText: 'A body of mass 2 kg is moving with velocity 3 m/s. What is its kinetic energy?',
            options: { A: '6 J', B: '9 J', C: '12 J', D: '18 J' },
            correctAnswer: 'B',
            topic: 'Work Energy Power',
            difficulty: 'Medium',
            explanation: 'KE = ½mv² = ½ × 2 × 3² = ½ × 2 × 9 = 9 J',
            marks: 3,
          },
          {
            questionText: 'Which law states that every action has an equal and opposite reaction?',
            options: { A: 'First Law', B: 'Second Law', C: 'Third Law', D: 'Law of Gravitation' },
            correctAnswer: 'C',
            topic: 'Laws of Motion',
            difficulty: 'Easy',
            explanation: 'Newton\'s Third Law of Motion states this principle.',
            marks: 2,
          },
          {
            questionText: 'What is the acceleration due to gravity on Earth (approximate)?',
            options: { A: '8.9 m/s²', B: '9.8 m/s²', C: '10.8 m/s²', D: '11.8 m/s²' },
            correctAnswer: 'B',
            topic: 'Gravitation',
            difficulty: 'Easy',
            explanation: 'Standard acceleration due to gravity is approximately 9.8 m/s²',
            marks: 2,
          },
          {
            questionText: 'A projectile is launched at 45°. What is its range compared to other angles (same initial velocity)?',
            options: { A: 'Minimum', B: 'Maximum', C: 'Zero', D: 'Depends on mass' },
            correctAnswer: 'B',
            topic: 'Projectile Motion',
            difficulty: 'Medium',
            explanation: 'Range R = (u²sin2θ)/g is maximum when θ = 45° (sin90° = 1)',
            marks: 3,
          },
          {
            questionText: 'What is the momentum of a 5 kg object moving at 4 m/s?',
            options: { A: '9 kg·m/s', B: '20 kg·m/s', C: '1.25 kg·m/s', D: '40 kg·m/s' },
            correctAnswer: 'B',
            topic: 'Momentum',
            difficulty: 'Easy',
            explanation: 'p = mv = 5 × 4 = 20 kg·m/s',
            marks: 2,
          },
          {
            questionText: 'In uniform circular motion, the acceleration is directed towards:',
            options: { A: 'Tangent', B: 'Center', C: 'Outward', D: 'None' },
            correctAnswer: 'B',
            topic: 'Circular Motion',
            difficulty: 'Medium',
            explanation: 'Centripetal acceleration is always directed towards the center.',
            marks: 3,
          },
          {
            questionText: 'What is the work done when a force of 10 N moves an object by 5 m in the direction of force?',
            options: { A: '2 J', B: '15 J', C: '50 J', D: '0.5 J' },
            correctAnswer: 'C',
            topic: 'Work Energy Power',
            difficulty: 'Easy',
            explanation: 'W = F × d = 10 × 5 = 50 J',
            marks: 3,
          },
        ],
      },
    },
  });

  // Create Chemistry Test
  const chemistryTest = await prisma.mockTest.upsert({
    where: { id: 'chemistry-periodic-test-1' },
    update: {},
    create: {
      id: 'chemistry-periodic-test-1',
      title: 'Chemistry - Periodic Table & Bonding',
      subject: 'Chemistry',
      examType: 'JEE',
      totalMarks: 15,
      durationMinutes: 20,
      description: 'Test your knowledge of periodic table and chemical bonding',
      difficulty: 'Easy',
      questions: {
        create: [
          {
            questionText: 'What is the atomic number of Carbon?',
            options: { A: '4', B: '6', C: '8', D: '12' },
            correctAnswer: 'B',
            topic: 'Periodic Table',
            difficulty: 'Easy',
            explanation: 'Carbon has 6 protons, hence atomic number 6.',
            marks: 2,
          },
          {
            questionText: 'Which type of bond is formed between Na and Cl in NaCl?',
            options: { A: 'Covalent', B: 'Ionic', C: 'Metallic', D: 'Hydrogen' },
            correctAnswer: 'B',
            topic: 'Chemical Bonding',
            difficulty: 'Easy',
            explanation: 'NaCl is formed by transfer of electron from Na to Cl, forming ionic bond.',
            marks: 2,
          },
          {
            questionText: 'Which element has the highest electronegativity?',
            options: { A: 'Oxygen', B: 'Chlorine', C: 'Fluorine', D: 'Nitrogen' },
            correctAnswer: 'C',
            topic: 'Periodic Properties',
            difficulty: 'Medium',
            explanation: 'Fluorine has the highest electronegativity of 3.98 on Pauling scale.',
            marks: 3,
          },
          {
            questionText: 'What is the electronic configuration of Sodium (Na)?',
            options: { A: '2,8,1', B: '2,8,2', C: '2,8,8,1', D: '2,7,1' },
            correctAnswer: 'A',
            topic: 'Atomic Structure',
            difficulty: 'Easy',
            explanation: 'Sodium (Z=11) has configuration 2,8,1',
            marks: 2,
          },
          {
            questionText: 'Which of the following is a noble gas?',
            options: { A: 'Nitrogen', B: 'Oxygen', C: 'Argon', D: 'Hydrogen' },
            correctAnswer: 'C',
            topic: 'Periodic Table',
            difficulty: 'Easy',
            explanation: 'Argon is a noble gas belonging to Group 18.',
            marks: 2,
          },
          {
            questionText: 'The shape of a water molecule is:',
            options: { A: 'Linear', B: 'Trigonal planar', C: 'Bent', D: 'Tetrahedral' },
            correctAnswer: 'C',
            topic: 'Molecular Geometry',
            difficulty: 'Medium',
            explanation: 'Water has a bent shape due to 2 lone pairs on oxygen.',
            marks: 4,
          },
        ],
      },
    },
  });

  // Create Math Test
  const mathTest = await prisma.mockTest.upsert({
    where: { id: 'math-calculus-test-1' },
    update: {},
    create: {
      id: 'math-calculus-test-1',
      title: 'Mathematics - Basic Calculus',
      subject: 'Mathematics',
      examType: 'JEE',
      totalMarks: 25,
      durationMinutes: 40,
      description: 'Test your calculus skills with derivatives and integrals',
      difficulty: 'Hard',
      questions: {
        create: [
          {
            questionText: 'What is the derivative of x²?',
            options: { A: 'x', B: '2x', C: 'x²', D: '2' },
            correctAnswer: 'B',
            topic: 'Differentiation',
            difficulty: 'Easy',
            explanation: 'd/dx(x²) = 2x using power rule',
            marks: 2,
          },
          {
            questionText: 'What is ∫x dx?',
            options: { A: 'x²', B: 'x²/2 + C', C: '2x', D: '1' },
            correctAnswer: 'B',
            topic: 'Integration',
            difficulty: 'Easy',
            explanation: '∫x dx = x²/2 + C using power rule for integration',
            marks: 2,
          },
          {
            questionText: 'What is the derivative of sin(x)?',
            options: { A: 'cos(x)', B: '-cos(x)', C: 'sin(x)', D: '-sin(x)' },
            correctAnswer: 'A',
            topic: 'Differentiation',
            difficulty: 'Easy',
            explanation: 'd/dx(sin x) = cos x',
            marks: 2,
          },
          {
            questionText: 'What is the derivative of e^x?',
            options: { A: 'xe^(x-1)', B: 'e^x', C: 'e^(x-1)', D: 'x·e^x' },
            correctAnswer: 'B',
            topic: 'Differentiation',
            difficulty: 'Easy',
            explanation: 'e^x is its own derivative',
            marks: 2,
          },
          {
            questionText: 'If f(x) = x³ - 3x, find f\'(2)',
            options: { A: '6', B: '9', C: '12', D: '3' },
            correctAnswer: 'B',
            topic: 'Differentiation',
            difficulty: 'Medium',
            explanation: 'f\'(x) = 3x² - 3, f\'(2) = 3(4) - 3 = 12 - 3 = 9',
            marks: 4,
          },
          {
            questionText: 'What is ∫cos(x) dx?',
            options: { A: 'sin(x) + C', B: '-sin(x) + C', C: 'cos(x) + C', D: '-cos(x) + C' },
            correctAnswer: 'A',
            topic: 'Integration',
            difficulty: 'Easy',
            explanation: '∫cos x dx = sin x + C',
            marks: 2,
          },
          {
            questionText: 'Find the critical points of f(x) = x³ - 6x² + 9x',
            options: { A: 'x = 1, 3', B: 'x = 0, 3', C: 'x = 2, 3', D: 'x = 1, 2' },
            correctAnswer: 'A',
            topic: 'Applications',
            difficulty: 'Hard',
            explanation: 'f\'(x) = 3x² - 12x + 9 = 3(x-1)(x-3) = 0, so x = 1, 3',
            marks: 5,
          },
          {
            questionText: 'What is the limit of (sin x)/x as x approaches 0?',
            options: { A: '0', B: '1', C: 'Undefined', D: 'Infinity' },
            correctAnswer: 'B',
            topic: 'Limits',
            difficulty: 'Medium',
            explanation: 'This is a standard limit: lim(x→0) sin(x)/x = 1',
            marks: 4,
          },
          {
            questionText: 'What is d/dx(ln x)?',
            options: { A: '1/x', B: 'x', C: 'ln x', D: 'e^x' },
            correctAnswer: 'A',
            topic: 'Differentiation',
            difficulty: 'Easy',
            explanation: 'd/dx(ln x) = 1/x',
            marks: 2,
          },
        ],
      },
    },
  });

  console.log('Mock tests seeded successfully!');
  console.log(`Created tests: ${physicsTest.title}, ${chemistryTest.title}, ${mathTest.title}`);
}

async function main() {
  try {
    await seedMockTests();
  } catch (error) {
    console.error('Error seeding data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
