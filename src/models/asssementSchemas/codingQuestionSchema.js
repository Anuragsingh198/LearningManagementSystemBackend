const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
  input: { type: String, required: true }, 
  expected_output: { type: String, required: true }, 
  is_sample: { type: Boolean, default: false }
});

const codingQuestionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], required: true },
  constraints: { type: String },
  sample_code: { type: String },
  language_id: { type: Number, default: 71 }, 
  run_code_testcases: [testCaseSchema], 
  submit_code_testcases: [testCaseSchema], 
}, { timestamps: true });

const CodingQuestion = mongoose.model("CodingQuestion", codingQuestionSchema);
module.exports = CodingQuestion

// export const dummyQuestions = [
//   {
//     title: "Sum of Two Numbers",
//     description: "Given two integers, output their sum.",
//     difficulty: "Easy",
//     constraints: "1 <= a,b <= 1000",
//     language_id: 71, // Python3
//     run_code_testcases: [
//       { input: "2 3\n", expected_output: "5\n", is_sample: true },
//       { input: "10 20\n", expected_output: "30\n", is_sample: true }
//     ],
//     submit_code_testcases: [
//       { input: "100 200\n", expected_output: "300\n" },
//       { input: "999 1\n", expected_output: "1000\n" }
//     ]
//   },
//   {
//     title: "Factorial",
//     description: "Given an integer n, output its factorial.",
//     difficulty: "Easy",
//     constraints: "0 <= n <= 12",
//     language_id: 71,
//     run_code_testcases: [
//       { input: "5\n", expected_output: "120\n", is_sample: true },
//       { input: "0\n", expected_output: "1\n", is_sample: true }
//     ],
//     submit_code_testcases: [
//       { input: "3\n", expected_output: "6\n" },
//       { input: "7\n", expected_output: "5040\n" }
//     ]
//   },
//   {
//     title: "Palindrome Check",
//     description: "Check if a given string is a palindrome (case-insensitive).",
//     difficulty: "Medium",
//     constraints: "String length <= 100",
//     language_id: 71,
//     run_code_testcases: [
//       { input: "madam\n", expected_output: "YES\n", is_sample: true },
//       { input: "hello\n", expected_output: "NO\n", is_sample: true }
//     ],
//     submit_code_testcases: [
//       { input: "Racecar\n", expected_output: "YES\n" },
//       { input: "Python\n", expected_output: "NO\n" }
//     ]
//   },
//   {
//     title: "Fibonacci Number",
//     description: "Given n, print the nth Fibonacci number (0-indexed).",
//     difficulty: "Medium",
//     constraints: "0 <= n <= 30",
//     language_id: 71,
//     run_code_testcases: [
//       { input: "5\n", expected_output: "5\n", is_sample: true },
//       { input: "0\n", expected_output: "0\n", is_sample: true }
//     ],
//     submit_code_testcases: [
//       { input: "7\n", expected_output: "13\n" },
//       { input: "10\n", expected_output: "55\n" }
//     ]
//   },
//   {
//     title: "Prime or Not",
//     description: "Given a number n, print YES if it's prime, otherwise NO.",
//     difficulty: "Easy",
//     constraints: "1 <= n <= 10^6",
//     language_id: 71,
//     run_code_testcases: [
//       { input: "5\n", expected_output: "YES\n", is_sample: true },
//       { input: "8\n", expected_output: "NO\n", is_sample: true }
//     ],
//     submit_code_testcases: [
//       { input: "97\n", expected_output: "YES\n" },
//       { input: "100\n", expected_output: "NO\n" }
//     ]
//   }
// ];
