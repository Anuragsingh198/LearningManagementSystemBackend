const { all } = require("axios");
const { default: axios } = require("axios");
const expressAsyncHandler = require("express-async-handler");
const judge0ServerUrl = process.env.JUDGE0_URL
const CodingQuestion = require('../models/asssementSchemas/codingQuestionSchema');
const Assessment = require("../models/CourseSchemas/mainAssessmentModal");
console.log('this is judge)url : ', judge0ServerUrl);
const getAllLanguages = async (req, res) => {
  try {
    const { data } = await axios.get(`${judge0ServerUrl}/languages`, {
      headers: {
        "Content-Type": "application/json",
        // If hosted Judge0 requires API key:
        // "X-RapidAPI-Key": process.env.RAPIDAPI_KEY
      }
    });

   const allowedLanguages = [
      "C (GCC 7.4.0)",
      "C++ (GCC 7.4.0)",
      "C (GCC 9.2.0)",
      "C++ (GCC 9.2.0)",
      "Java (OpenJDK 13.0.1)",
      "Python (3.8.1)"
    ];

    // Filter only these
    const filteredLanguages = data.filter(lang =>
      allowedLanguages.includes(lang.name)
    );
    // console.log("Filtered Languages:", filteredLanguages);

    res.status(200).json({
      success: true,
      languages: filteredLanguages
    });
  } catch (error) {
    console.error("Error fetching languages:", error?.message || error);
    res.status(500).json({
      success: false,
      message: error?.message || "Something went wrong while fetching languages"
    });
  }
};

const getQuestionById = async (req, res) => {
  try {
    const { questionId } = req.params;
    // console.log("this is the  question id : ", questionId)
    const allQuestions = await CodingQuestion.find();
    // console.log(' this is  all the  questions : ', allQuestions);
    const question = await CodingQuestion.findById(questionId).populate('run_code_testcases');

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    res.status(200).json({
      success: true,
      question: {
        id: question._id,
        title: question.title,
        description: question.description,
        difficulty: question.difficulty,
        runCodeTestCases: question.run_code_testcases,
        constraints: [question.constraints],
      },
    });
  } catch (error) {
    console.error("Error fetching question:", error?.message || error);
    res.status(500).json({
      success: false,
      message: error?.message || "Something went wrong while fetching question",
    });
  }
};


const runCode = async (req, res) => {
  try {
    const { source_code, language_id, test_cases } = req.body;

    console.log("=== Incoming Request Body ===");
    console.log("source_code:", source_code);
    console.log("language_id:", language_id);
    console.log("test_cases:", test_cases);

    if (!source_code || !language_id || !test_cases) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const submissionsPayload = {
      submissions: test_cases.map(tc => ({
        language_id,
        source_code: Buffer.from(source_code).toString("base64"),
        stdin: Buffer.from(tc.input).toString("base64"),
        expected_output: Buffer.from(tc.expected_output).toString("base64")
      }))
    };

    console.log("=== Submissions Payload to Judge0 ===");
    console.log(JSON.stringify(submissionsPayload, null, 2));

    const { data: batchResponse } = await axios.post(
      `${judge0ServerUrl}/submissions/batch?base64_encoded=true`,
      submissionsPayload,
      { headers: { "Content-Type": "application/json" } }
    );

    console.log("=== Raw Batch Response from Judge0 ===");
    console.log(JSON.stringify(batchResponse, null, 2));

    let tokens;
    if (Array.isArray(batchResponse)) {
      tokens = batchResponse.map(s => s.token);
    } else if (batchResponse.submissions) {
      tokens = batchResponse.submissions.map(s => s.token);
    } else {
      console.error("Unexpected Judge0 batch response format");
      return res.status(500).json({
        success: false,
        message: "Invalid response from Judge0"
      });
    }

    console.log("=== Tokens Retrieved ===");
    console.log(tokens);

    let results;
    while (true) {
      const { data } = await axios.get(
        `${judge0ServerUrl}/submissions/batch?tokens=${tokens.join(",")}&base64_encoded=true`
      );
      console.log("=== Polling Results from Judge0 ===");
      console.log(JSON.stringify(data, null, 2));

      results = data.submissions || data;
      console.log('=== Results from Judge0 ===')
      console.log(results)

      if (results.every(r => r.status?.id >= 3)) break;
      await new Promise(r => setTimeout(r, 500));
    }

    const finalResults = results.map((r, i) => ({
      testcase_input: test_cases[i].input,
      expected_output: test_cases[i].expected_output,
      compile_output: r.compile_output
  ? Buffer.from(r.compile_output, "base64").toString()
  : null,
      actual_output: r.stdout ? Buffer.from(r.stdout, "base64").toString() : null,
      stderr: r.stderr
    ? Buffer.from(r.stderr, "base64").toString()
    : null, 
      status: r.status?.description
    }));

    console.log("=== Final Decoded Results ===");
    console.log(finalResults);

    res.status(200).json({
      success: true,
      results: finalResults
    });
  } catch (error) {
    console.error("=== Error running code ===");
    console.error(error?.response?.data || error?.message || error);
    res.status(500).json({
      success: false,
      message: error?.message || "Something went wrong while running code"
    });
  }
};


const submitCode = async (req, res) => {
  try {
    const { code, languageId, questionId } = req.body;

    if (!code || !languageId || !questionId) {
  const missingFields = [];
  if (!code) missingFields.push("code");
  if (!languageId) missingFields.push("languageId");
  if (!questionId) missingFields.push("questionId");

  return res.status(400).json({
    success: false,
    message: `Missing required field(s): ${missingFields.join(", ")}`
  });
}

  // so i have to save the coding question in the coding answer field of assessment prgress in a particular format such that it matches frontend design, and then later...  format should be questionId, question text, your answer, is correct, testcased passed
  // when i submit the assessment in course controller, i should check whether coding quesiton is in the coding answer field or not and then if it is there add it to the questions array, since the strucutre will be the same, need not to worry

    const question = await CodingQuestion.findById(questionId);
    if (!question || !question.submit_code_testcases) {
      return res.status(404).json({ success: false, message: "Question or test cases not found" });
    }

    // Prepare Judge0 batch payload (Base64 encoded)
    const submissionsPayload = {
      submissions: question.submit_code_testcases.map(tc => ({
        language_id: languageId,
        source_code: Buffer.from(code).toString("base64"),
        stdin: Buffer.from(tc.input || "").toString("base64"),
        expected_output: Buffer.from(tc.expected_output || "").toString("base64")
      }))
    };

    // Send batch request
    const { data: batchResponse } = await axios.post(
      `${judge0ServerUrl}/submissions/batch?base64_encoded=true`,
      submissionsPayload,
      { headers: { "Content-Type": "application/json" } }
    );

    // Extract tokens from response
    let tokens;
    if (Array.isArray(batchResponse)) {
      tokens = batchResponse.map(s => s.token);
    } else if (batchResponse.submissions) {
      tokens = batchResponse.submissions.map(s => s.token);
    } else {
      console.error("Unexpected Judge0 batch response:", batchResponse);
      return res.status(500).json({ success: false, message: "Invalid response from Judge0" });
    }

    if (!tokens || tokens.length === 0) {
      return res.status(500).json({ success: false, message: "No tokens received from Judge0" });
    }

    // Poll until all results are ready
    let allDone = false;
    let results = null;

    while (!allDone) {
      const { data } = await axios.get(
        `${judge0ServerUrl}/submissions/batch?tokens=${tokens.join(",")}&base64_encoded=true`,
        { headers: { "Content-Type": "application/json" } }
      );

      results = Array.isArray(data) ? data : data.submissions;

      allDone = results.every(r => r.status && r.status.id > 2); // 1=In Queue, 2=Processing
      if (!allDone) {
        await new Promise(resolve => setTimeout(resolve, 1500)); // Wait 1.5 sec before retry
      }
    }

    // Decode base64 outputs for easier reading
    results = results.map(r => ({
      ...r,
      stdout: r.stdout ? Buffer.from(r.stdout, "base64").toString("utf-8") : null,
      stderr: r.stderr ? Buffer.from(r.stderr, "base64").toString("utf-8") : null,
      compile_output: r.compile_output
        ? Buffer.from(r.compile_output, "base64").toString("utf-8")
        : null,
      expected_output: r.expected_output
        ? Buffer.from(r.expected_output, "base64").toString("utf-8")
        : null
    }));

    return res.status(200).json({
      success: true,
      message: "Code submitted successfully",
      submissions: submissionsPayload.submissions,
      results
    });

  } catch (error) {
    console.error("Submit Code Error:", error?.response?.data || error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const fetchAllCodingQuestions = async (req, res) => {
  try {
    const allCodingQuestions = await CodingQuestion.find()
    res.status(200).json({
      success: true,
      allCodingQuestions: allCodingQuestions
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error?.message || "Something went wrong fetching all the questions"
    })
  }
}


const addAssessment = async (req, res) => {
  try {
    const {
      isMandatory,
      title,
      description,
      topics,
      duration,
      mcqQuestions = [],
      codingQuestions = [],
      testType
    } = req.body;

     let newAssessment;

    // Map mcqQuestions into schema format
    if (testType === 'mcq' || testType === 'both') {
      const formattedMcqQuestions = mcqQuestions.map(q => ({
        questionText: q.questionText,
        type: q.type || 'mcq',
        options: q.options.map(opt => ({ optionText: opt })),
        correctAnswer: q.correctAnswer
      }));
      const numberOfQuestions = mcqQuestions.length + codingQuestions.length
      newAssessment = new Assessment({
        isMandatory,
        title,
        description,
        topics,
        duration,
        testType,
        numberOfQuestions: numberOfQuestions,
        questions: formattedMcqQuestions,
        codingQuestionIds: codingQuestions
      });

      await newAssessment.save();

      // console.log('the new assessment stored in mongodb is: ', newAssessment)

    }

      if (testType === 'coding') {
      const numberOfQuestions = codingQuestions.length
      newAssessment = new Assessment({
        isMandatory,
        title,
        description,
        topics,
        duration,
        testType,
        numberOfQuestions: numberOfQuestions,
        codingQuestionIds: codingQuestions
      });

      await newAssessment.save();

      // console.log('the new assessment stored in mongodb is: ', newAssessment)

    }


    return res.status(201).json({
      success: true,
      message: "Assessment created successfully",
      data: newAssessment
    });

  } catch (error) {
    console.error("Error in addAssessment:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to add assessment",
      error: error.message
    });
  }
};



module.exports = {
  getAllLanguages,
  getQuestionById,
  submitCode,
  runCode,
  fetchAllCodingQuestions,
  addAssessment
}