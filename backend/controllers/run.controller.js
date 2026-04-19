import Problem from "../models/Problem.js";
import { languageMap } from "../config/languages.js";
import submissionQueue from "../services/bullMQ.queue.js";


const normalize = (str) => {
  return (str || "").trim().replace(/\s+/g, " ");
};

const codeRunner = async (req, res) => {
  try {
    const { problemId, code, language } = req.body;

    if (!problemId || !code || !language) {
      return res.status(400).json({
        success: false,
        message: "Missing fields"
      });
    }

    const problem = await Problem.findById(problemId);

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: "Problem not found"
      });
    }

    const language_id = languageMap[language];

    if (!language_id) {
      return res.status(400).json({
        success: false,
        message: "Unsupported language"
      });
    }

    const userId = req.user.id;

    await submissionQueue.add('runSubmission', {
      problemId,
      code,
      language,
      userId,
      type:"runTest"
    });

    res.status(200).json({
      success: true,
      message: "Code is being executed"
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export default codeRunner;




// import java.util.*;
// class Main {
//     public static void main(String[] args) {
//         Scanner sc = new Scanner(System.in);
//         int a = sc.nextInt();
//         int b= sc.nextInt();
//         System.out.println(a+b);
//     }
// }
    