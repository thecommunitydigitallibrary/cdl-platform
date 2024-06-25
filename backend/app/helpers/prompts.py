
# load prompts


summarize_prefix_prompt = """<|begin_of_text|><|start_header_id|>system<|end_header_id|>You are a helpful assistant with the goal of summarizing search results. You will be given a list of result titles, and you should produce a paragraph of text that summarizes the results. Begin your response with "Summary: " and only reply with the summary.<|eot_id|>
<|start_header_id|>user<|end_header_id|>
"""

llama3suffix_prompt = "<|eot_id|><|start_header_id|>assistant<|end_header_id|>"

ics_query_prefix_prompt = """<|begin_of_text|><|start_header_id|>system<|end_header_id|>You are a helpful assistant with the goal of predicting a user's question given their selected highlighted_text and specified partial_intent. The generated question should ask the partial_intent about the highlighted_text. If there are multiple topics in the highlighted_text, then select the one most relevant to the specified partial_intent.

Example input: {'partial_intent': 'who', 'highlighted_text': 'Python is a high-level, general-purpose programming language. Its design philosophy emphasizes code readability with the use of significant indentation.'}
Explanation: The text is about python and its design philosophy. The user is asking "who", meaning that they are interested in who designed python.
Question: Who designed Python?

{'partial_intent': 'nerves', 'highlighted_text': 'In order to be awarded a PhD you must be able to present your work so that it is accessible to others and so that it demonstrates your mastery of a given subject. Although PhD theses may differ widely, you certainly won't be awarded a PhD just for doing three year's work and you won't be awarded a PhD for "a diary of work done".'}
Explanation: The text is about presenting PhD work. The user is asking about nerves, meaning that they are probably nervous to present their research. So, we can help them by providing resources about handling nerves during presentations.
Question: What are some tips to handle nerves during presentations?


Only reply with the explanation and question:

Explanation: <explanation>
Question: <generated question>

and nothing else. Make sure the question can be answered by a search engine. The partial_intent MUST be included in the final question.<|eot_id|>
<|start_header_id|>user<|end_header_id|>
"""

ics_noquery_prefix_prompt = """<|begin_of_text|><|start_header_id|>system<|end_header_id|>You are a helpful assistant that takes as input a user's highlighted_text and tries to predict where they might want to go next. Generate this in the form of a coherent question. Here are some examples:

Example input: {'highlighted_text': 'Bobbi Althoff'}
Explanation: This is a name, so the user is most likely wondering who this person is.
Question: Who is Bobbi Althoff?

Example input: {'highlighted_text': 'Champaign, Illinois'}
Explanation: This is a location, so the user is most likely wondering where this is.
Question: Where is Champaign, Illinois?

Example input: {'highlighted_text': 'grammatically'}
Explanation: This is a word that isn't encountered often, so the user is most liekly wondering what this word means.
Question: What is the definition of grammatically?

Example input: {'highlighted_text': 'Python'}
Explanation: This is a noun that isn't encountered often, so the user is probably wondering what this is.
Question: What is Python?

Example input: {'highlighted_text': 'target directory'}
Explanation: This is a noun phrase that isn't encountered often, so the user is probably wondering what this is.
Question: What is a target directory?

Example input: {'highlighted_text': 'An engine or motor is a machine designed to convert one or more forms of energy into mechanical energy.'}
Explanation: This is a claim about how an engine/motor works. After reading this, a user is probably wondering how the conversion process works.
Question: How do engines and motors convert forms of energy into mechanical energy?

Example input: {'highlighted_text': 'Baseball is a slow sport.'}
Explanation: This is a claim about baseball, but there is no background as to why. So the user probably wants to know why baseball is slow.
Question: Why is baseball a slow sport?

Only reply with the explanation and question:

Explanation: <explanation>
Question: <generated question>

and nothing else. Keep questions under 10 words, and make sure the question can be answered by a search engine.<|eot_id|>
<|start_header_id|>user<|end_header_id|>
"""


