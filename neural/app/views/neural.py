from flask import Blueprint, request
from flask_cors import CORS
from sentence_transformers import CrossEncoder
import torch
import traceback
import os
import json
import time
from vllm import LLM, SamplingParams
from flask_cors import CORS
from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig

os.environ["CUDA_VISIBLE_DEVICES"]="1"


neural = Blueprint('neural', __name__)
CORS(neural)

# set up rerank model
try:
    rerank_model = CrossEncoder('cross-encoder/ms-marco-TinyBERT-L-2', max_length=512)
except Exception as e:
    rerank_model = False
    print("No rerank", e)

# set up generate model
try:
    # TODO RUN THIS WITH CHANGES
    #sampling_params = SamplingParams(temperature=0, top_p=1, max_tokens=200, use_beam_search=True, length_penalty=1.5, best_of=3, n=1)
    sampling_params = SamplingParams(temperature=0, top_p=0.95, max_tokens=2000)

    generate_model = LLM(model="vicuna-7b-v1.5-awq/", quantization="AWQ", gpu_memory_utilization=0.5)
    
except Exception as e:
    generate_model = False
    print("No generate", e)


# load prompts
context_qgen_prompt = """You are a helpful assistant that generates questions about some given textual context. The generated questions should not be answered by the context. Here are some examples:
CONTEXT: "The Eiffel Tower was originally intended to be dismantled after 20 years" --> QUESTIONS: {"1": "Why was the Eiffel Tower intended to be dismantled after 20 years?", "2": "What changed the decision to keep the Eiffel Tower standing?", "3": "How has the purpose of the Eiffel Tower evolved since its original construction?"}
CONTEXT: "Honey never spoils and has been found in edible condition in ancient tombs." --> QUESTIONS: {"1": "What properties of honey prevent it from spoiling?", "2": "In which ancient tombs has edible honey been found?", "3": "How can honey remain edible for thousands of years?"}
CONTEXT: "Octopuses have three hearts" --> QUESTIONS: {"1": "Why do octopuses have three hearts?", "2": "How do the three hearts of an octopus function together?", "3": "What other animal(s) besides octopuses have three hearts?"}
CONTEXT: "JavaScript" --> QUESTIONS: {"1": "What is JavaScript?", "2": "When is JavaScript used?", "3": "How can I learn JavaScript?"}
CONTEXT: "china " --> QUESTIONS: {"1": "Where is China?", "2": "What is China known for?", "3": "What is the history of China?"}
CONTEXT: "perceptual" --> QUESTIONS: {"1": "What is the definition of perceptual?", "2": "What is the etymology of perceptual?", "3": "What are some example sentences that use the word perceptual?"}
Now do the same for the following, and only do so for the provided context. Here is the context: CONTEXT: 
"""

context_intent_qgen_prompt = """You are a helpful assistant that generates questions about some given textual context and intent. The generated questions should contain the intent and not be answered by the context. Here are some examples:
CONTEXT: "The Eiffel Tower was originally intended to be dismantled after 20 years" INTENT: "history" --> QUESTIONS: {"1": "What is the history of the Eiffel Tower?", "2": "How has the perception of the Eiffel Tower changed over history?", "3": "How has the Eiffel Tower changed over history?"}
CONTEXT: "Honey never spoils and has been found in edible condition in ancient tombs." INTENT: "where" --> QUESTIONS: {"1": "Where are the ancient tombs that honey has been found?"}
CONTEXT: "Octopuses have three hearts" INTENT: "why" --> QUESTIONS: {"1": "Why do octopuses have three hearts?", "2": "Why do octopuses need three hearts?", "3": "Why did octopuses evolve to have three hearts?"}
CONTEXT: "JavaScript" INTENT: "applications" --> QUESTIONS: {"1": "What are the applications of JavaScript?", "2": "What problems can Javascript be applied to?", "3": "What applications run on JavaScript?"}
CONTEXT: "china " INTENT: "conflicts" --> QUESTIONS: {"1": "What conflicts has China been involved with?", "2": "Has China ever started a conflict?", "3": "Which contries does China have conflicting relationships with?"}
CONTEXT: "perceptual" INTENT: "definition" --> QUESTIONS: {"1": "What is the definition of perceptual?"}
Now do the same for the following, and only do so for the provided context. Here is the context: CONTEXT: 
"""

contextquery_qgen_s1 = "Given the context - "
contextquery_qgen_s2 = " - and the intent - "
contextquery_qgen_s3 = " - please ask three questions about the context that relate it to the intent. Just output the JSON File of the three generated questions, only a single JSON entry, and nothing else."

contextquery_qgen_prefix = """You are a helpful assistant that generates questions given "context" and "intent". Here are some examples:"
    {
        "context": "The Eiffel Tower was originally intended to be dismantled after 20 years.",
        "intent": "historical significance",
        "q1": "What historical events led to the decision to keep the Eiffel Tower standing?",
        "q2": "How has the Eiffel Tower's role in Paris's landscape changed over time?",
        "q3": "What were the initial public and official reactions to the construction of the Eiffel Tower?"
    },
    {
        "context": "Honey never spoils and has been found in edible condition in ancient tombs.",
        "intent": "preservative qualities",
        "q1": "What scientific explanation accounts for honey's long-lasting preservation properties?",
        "q2": "Can the discovery of honey in ancient tombs provide insights into ancient food storage techniques?",
        "q3": "How does the composition of honey contribute to its indefinite shelf life?"
    },
    {
        "context": "Octopuses have three hearts and blue blood.",
        "intent": "biological adaptations",
        "q1": "How do the three hearts of an octopus work together to support its physiological functions?",
        "q2": "In what ways does the blue blood of an octopus enhance its survival in deep-sea environments?",
        "q3": "What evolutionary advantages do octopuses gain from their unique circulatory system?"
    },
    {
        "context": "The Great Wall of China is longer than previously thought, extending over 21,000 kilometers.",
        "intent": "archaeological discoveries",
        "q1": "What methods have archaeologists used to uncover previously unknown sections of the Great Wall?",
        "q2": "How has the revised length of the Great Wall impacted our understanding of ancient Chinese defense strategies?",
        "q3": "What challenges do conservationists face in preserving the newly discovered sections of the Great Wall?"
    },
    {
        "context": "Shakespeare invented over 1,700 words that we use today.",
        "intent": "innovation",
        "q1": "How did Shakespeare's creation of new words reflect the cultural and social shifts of his time?",
        "q2": "What process might Shakespeare have used to invent new words and integrate them into his works?",
        "q3": "How have Shakespeare's invented words influenced the evolution of the English language?"
    },
    {
        "context": "The heart of a blue whale is as large as a small car.",
        "intent": "biology",
        "q1": "What correlation exists between the size of a blue whale's heart and its aquatic lifestyle?",
        "q2": "How do researchers measure and study the heart of such a large marine animal?",
        "q3": "What insights does the anatomy of a blue whale's heart provide into the species' evolutionary history?"
    },
    {
        "context": "Venus rotates in the opposite direction to most planets in our solar system.",
        "intent": "science",
        "q1": "What theories explain Venus's retrograde rotation compared to other planets?",
        "q2": "How does this unique rotation affect the climate and atmospheric dynamics on Venus?",
        "q3": "What implications does Venus's rotation have for understanding planetary formation and behavior?"
    },
    {
        "context": "The Library of Alexandria was one of the largest and most significant libraries of the ancient world.",
        "intent": "heritage",
        "q1": "What factors contributed to the rise and fall of the Library of Alexandria?",
        "q2": "How did the loss of the Library of Alexandria affect the accumulation of knowledge in the ancient world?",
        "q3": "What might modern civilization have gained if the Library of Alexandria had been preserved?"
    },
    {
        "context": "Polar bear fur is not white; it is actually transparent and hollow.",
        "intent": "adaptation strategies",
        "q1": "How does the unique structure of polar bear fur aid in their thermal regulation?",
        "q2": "What role does the transparency and hollowness of the fur play in polar bears' camouflage?",
        "q3": "How do polar bears' physical adaptations contribute to their survival in extreme arctic conditions?"
    },
    {
        "context": "The Internet was invented in the late 1960s and initially called ARPANET.",
        "intent": "technological evolution",
        "q1": "What was the original purpose and applications of ARPANET?",
        "q2": "How did ARPANET evolve into today's Internet and where is it applied?",
        "q3": "What were some of the first applications of ARPANET?"
    }"""




context_qgen_prompt_beforesent = """Given the context - """
context_qgen_prompt_aftersent = """ - Please ask three questions related to it. Here are some context and question examples:
    {
        "context": "The Eiffel Tower was originally intended to be dismantled after 20 years.",
        "q1": "Why was the Eiffel Tower intended to be dismantled after 20 years?",
        "q2": "What changed the decision to keep the Eiffel Tower standing?",
        "q3": "How has the purpose of the Eiffel Tower evolved since its original construction?"
    },
    {
        "context": "honey never spoils and has been found in edible condition in ancient tombs",
        "q1": "What properties of honey prevent it from spoiling?",
        "q2": "In which ancient tombs has edible honey been found?",
        "q3": "How can honey remain edible for thousands of years?"
    },
    {
        "context": "octopuses have three hearts and blue blood",
        "q1": "Why do octopuses have three hearts?",
        "q2": "What causes the blood of an octopus to be blue?",
        "q3": "How do the three hearts of an octopus function together?"
    },
    {
        "context": "perceptual",
        "q1": "What is the definition of perceptual?",
        "q2": "What is the etymology of perceptual?",
        "q3": "What are some example sentences that use the word perceptual?"
    },
    {
        "context": "The Great Wall of China is longer than",
        "q1": "How was the new length of the Great Wall of China determined?",
        "q2": "What challenges are faced in maintaining such a long structure?",
        "q3": "What historical events led to the continuous expansion of the Great Wall?"
    },
    {
        "context": "Shakespeare invented over 1,700 words that we use today.",
        "q1": "Can you provide some examples of words invented by Shakespeare?",
        "q2": "How did Shakespeare contribute to the development of the English language?",
        "q3": "What impact has Shakespeare's vocabulary had on modern English?"
    },
    {
        "context": "The heart of a blue whale is as large as a small car",
        "q1": "How does the size of a blue whale's heart compare to other animals?",
        "q2": "What are the implications of having such a large heart for a blue whale?",
        "q3": "How much blood can a blue whale's heart pump in a single beat?"
    },
    {
        "context": "JavaScript",
        "q1": "What is JavaScript?",
        "q2": "When is JavaScript used?",
        "q3": "How can I learn JavaScript?"
    },
    {
        "context": "The Library of Alexandria was one of the largest and most significant libraries of the ancient world.",
        "q1": "What made the Library of Alexandria so significant in the ancient world?",
        "q2": "What kinds of works were housed in the Library of Alexandria?",
        "q3": "How did the destruction of the Library of Alexandria impact historical knowledge?"
    },
    {
        "context": "Polar bear fur is not white; it is actually transparent and hollow.",
        "q1": "How does the transparent and hollow nature of polar bear fur help them in their environment?",
        "q2": "What is the purpose of the hollow structure in polar bear fur?",
        "q3": "How does the fur appear white if it is actually transparent?"
    },
    {
        "context": "The Internet was invented in the late 1960s and initially called ARPANET.",
        "q1": "What was the original purpose of ARPANET?",
        "q2": "How did ARPANET evolve into the modern Internet?",
        "q3": "What were some of the key milestones in the development of the Internet?"
    },
    {
        "context": "The Internet was invented in the late 1960s and initially called ARPANET.",
        "q1": "What was the original purpose of ARPANET?",
        "q2": "How did ARPANET evolve into the modern Internet?",
        "q3": "What were some of the key milestones in the development of the Internet?"
    }
 Just output the JSON File of the three generated questions, only a single JSON entry, and nothing else."""





@neural.route('/neural/generate', methods=["POST"])
def generate():
    """
    Endpoint for generating text in the extension.
	Arguments:
		request args with:
			query : (string) : the typed query of the user.
			context: (string) : the highlighted text by the user.
			mode : (str) : one of
                qa : given a query, generate the answer
                contextual_qa : given a context and a portion of a query, generate the answer
                gen_questions: given a context, generate some questions
                summarize : given a context, summarize the selection
	Returns:
		200 : output of generation.
    """
    request_json =  request.get_json()

    context = request_json.get("context", "")
    query = request_json.get("query", "")
    mode = request_json.get("mode", "")

    print("context", context)
    print("query", query)
    print("mode", mode)

    if not generate_model:
        return {"message": "Generation model not initialized."}, 500

    """
    VERSION: 0.2 (Vicuna)
    """
    
    if mode == "qa":
        if not query:
            return {"message": "Query required for question-answer mode."}, 400
        prompt = "Answer the following question with fewer than 100 words. Question: " + query + ". Answer: "

    elif mode == "contextual_qa":
        if not context:
            return {"message": "Context required for in-context question generation."}, 400
        if not query:
            return {"message": "Query required for in-context question generation."}, 400
        
        prompt = context_intent_qgen_prompt + '"' + context + '" INTENT: ' + query + '" --> QUESTIONS:'
        #prompt = contextquery_qgen_prefix + contextquery_qgen_s1 + context + contextquery_qgen_s2 + query + contextquery_qgen_s3
        

    elif mode == "gen_questions":
        if not context:
            return {"message": "Context required for question generation."}, 400

        prompt = context_qgen_prompt + '"' + context + '" --> QUESTIONS:'

        #prompt = context_qgen_prompt_beforesent + context + context_qgen_prompt_aftersent

    elif mode == "summarize":
        if not context:
            return {"message": "Context required for summarization."}, 400
        prompt = context + "... Please summarize the previous text, and only reply with the summary. Summary: "
    
    try:
        prompts = [prompt]
        start_time = time.time()
        outputs = generate_model.generate(prompts, sampling_params)
        stop_time = time.time()
        output = outputs[0].outputs[0].text
        print("Request completed in ", stop_time-start_time)
    except Exception as e:
        traceback.print_exc()
        return {"message": "Something went wrong with generation, please try again later."}, 400

    return {"output": output}



@neural.route("/neural/rerank/", methods=["POST"])
def neural_rerank():
    """
	Helper function for neural reranking.
	Arguments:
		query : (string): the original user query
		pages : (list) : an array of processed submissions
		topn : (int, default=50) : the number of results to rerank 
	Returns:
		pages : (list) : a reranked pages	
	"""

    data = request.get_json()


    query = data.get("query")
    pages = data.get("pages")
    topn = data.get("topn", 50)

    if not query or not pages:
        print("Missing query or pages")
        return {"pages": pages}, 400


    if rerank_model and len(query.split()) > 2:
        model_input = []
        for hit in pages[:topn]:
            # limit of 200 words or 500 characters
            trunc_exp = " ".join(hit["explanation"].split()[:200])[:500]
            trunc_high = " ".join(hit["highlighted_text"].split()[:200])[:500]
            trunc_query = " ".join(query.split()[:200])[:500]
            model_input.append((trunc_query, trunc_exp + " | " + trunc_high))
        if model_input:
            scores = rerank_model.predict(model_input)
            for i, score in enumerate(scores):
                pages[i]["score"] = pages[i]["score"] + 10 * score

    return {"pages": pages}, 200