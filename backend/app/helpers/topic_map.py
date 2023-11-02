import json
import re
import pandas as pd
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer
# from keybert import KeyBERT
# from sentence_transformers import SentenceTransformer
from collections import OrderedDict
import time
from textblob import TextBlob
from typing import List, Dict
from app.helpers.helper_constants import RE_LECTURE_TAG, RE_LECTURE_NUM, RE_LECTURE_WITHOUT_TAG, TOP_N_SUBMISSIONS, META_DESCRIPTOR, \
    KEYWORDS_IGNORE
from app.helpers.helpers import extract_hashtags

class TopicMap:
    '''
        Class to read submissions JSON and create a Lecture to Topic Map.
    '''

    def __init__(self, *args) -> None:
        if len(args) == 0:
            raise Exception("Need to pass the json to the TopicMap()")

        self.data = None
        self.submission_df = pd.read_json(args[0])
        self.community_name = args[1]
        self.ps = PorterStemmer()
        self.lec_to_obj = OrderedDict()
        self.lec_to_topics = {}

        self.meta_desc = {}
        self.meta_desc_set = set()
        self.meta_desc_to_obj = {}

    def read_file(self, file_name: str) -> None:
        '''
        This method reads a JSON of submissions.

        Parameters:
            file_name (str): Name of the file containing submissions.

        Returns:
            None.
        '''
        f = open(file_name, "r")
        self.data = json.loads(f.read())

    def write_to_file(self, file_name: str, d: dict) -> None:
        '''
        This method writes JSON to a file

        Parameters:
            file_name (str): Name of the file.
        Returns:
            None.
        '''
        out = open(file_name, "w")
        json.dump(d, out, indent=4)

    def write_to_df(self, file_name: str) -> None:
        '''
        This method reads the submissions JSON file and creates a dataframe.

        Parameters:
            file_name (str): Name of the file containing submissions.

        Returns:
            None.
        '''
        self.submission_df = pd.read_json(file_name)

        # Build Object ID to Object map for future use
        for obj in self.data:
            self.objid_to_obj[obj['_id']['$oid']] = obj

    def stem_metadescriptor(self) -> None:
        '''
        This method will stem the meta descriptors which are listed in constants.py.

        Parameters:
            None.

        Returns:
            None.
        '''
        self.meta_desc = {}
        for name, md_list in META_DESCRIPTOR.items():
            lemma_l = []
            for word in md_list:
                lemma_l.append(self.ps.stem(word))
            self.meta_desc[name] = lemma_l

    def pre_process(self) -> None:
        '''
        This method pre-processes the submissions dataframe.

        Parameters:
            None.

        Returns:
            None.
        '''
        # Stem the meta descriptors
        self.stem_metadescriptor()

        # Set meta_desc_to_obj
        for name, v in self.meta_desc.items():
            self.meta_desc_to_obj[name] = []
            self.meta_desc_set = self.meta_desc_set.union(v)

        # Extract lectures from explanation and build ObjID to Obj map
        self.extract_lec_to_obj()

    def add_to_lec_to_obj_map(self, lec_id: str, obj_id: str, meta_descriptor_list: List[str]) -> None:
        '''
        This method adds the obj and metadescriptors to lec to obj map

        Parameters:
            lec_id(str): Lecture ID
            obj_id(str): Obj Index in Data frame
            meta_descriptor_list(List(str)): List of meta descriptors extracted from the submission title

        Returns:
            None
        '''
        # Add to lec_id -> obj_idx list
        if self.lec_to_obj.get(lec_id):
            self.lec_to_obj[lec_id]["obj_idx"].append(obj_id)
        else:
            self.lec_to_obj[lec_id] = {}
            self.lec_to_obj[lec_id]["meta_descriptors"] = {}
            self.lec_to_obj[lec_id]["obj_idx"] = [obj_id]

        # Handle lec_id -> metadescriptor
        for meta_descriptor in meta_descriptor_list:
            if self.lec_to_obj[lec_id]["meta_descriptors"].get(meta_descriptor):
                self.lec_to_obj[lec_id]["meta_descriptors"][meta_descriptor].append(obj_id)
            else:
                self.lec_to_obj[lec_id]["meta_descriptors"][meta_descriptor] = [obj_id]

    def extract_lec_to_obj(self) -> None:
        '''
        This method parses the explanations in submissions dataframe to extract lecture numbers and creates a lecture map with the following structure:
        lec_id : {
            'obj_idx': [id1, id2, ]
            'meta_descriptors': {
                'descriptor_1': [id4, id7],
                'descriptor_2': [id9], ..
            }
        }

        Parameters:
            None.

        Returns:
            None.
        '''
        for idx, row in self.submission_df.iterrows():
            expl = row['explanation']
            meta_descriptors = self.get_meta_descriptor(expl)
            tags_from_re = extract_hashtags(expl)
            if tags_from_re:
                if len(tags_from_re) > 0:
                    for tag in tags_from_re:
                        self.add_to_lec_to_obj_map(tag, idx, meta_descriptors)
                else:
                    self.add_to_lec_to_obj_map("-1", idx, meta_descriptors)
            else:
                self.add_to_lec_to_obj_map("-1", idx, meta_descriptors)

    def get_meta_descriptor(self, s: str) -> List[str]:
        '''
        This method is used to get the matching meta descriptors from an explanation by stemming each token in the string.

        Parameters:
            s (str): Explanation.

        Returns:
            list(str): List of meta descriptors found.
        '''
        f = 0
        op = set()
        tokens = word_tokenize(s)
        for token in tokens:
            stem = self.ps.stem(token)
            for name, md_list in self.meta_desc.items():
                if stem in md_list:
                    op.add(name)
        if len(op) > 0:
            return list(op)
        else:
            return ["Miscellaneous"]

    def post_process_explanation(self, s: str) -> str:
        '''
        This method is used to remove lecture hashtags and `lecture` string from the explanation before feeding it to the keyword extractor model.

        Parameters:
            s (str): The explanation for a submission.

        Returns:
            op (str): Explanation without lecture hashtags and `lecture` string.
        '''
        op = ""
        # Remove hashtags
        s = re.sub(RE_LECTURE_TAG, "", s)
        #s = re.sub(RE_LECTURE_WITHOUT_TAG, "", s)
        # Remove meta-descriptors
        tokens = word_tokenize(s)
        for token in tokens:
            stem = self.ps.stem(token)
            if stem in self.meta_desc_set or token.lower() == 'lecture':
                continue
            else:
                op += token + " "
        return op

    def extract_keywords(self) -> None:
        '''
        Extract keywords using TextBlob.

        Paramters:
            None.

        Returns:
            None.
        '''
        i = 0
        for lec, m in self.lec_to_obj.items():
            objid_lst = m["obj_idx"]
            i += 1
            kw_freq = {}
            for obj in objid_lst:
                row = self.submission_df.iloc[obj]
                expl = row['explanation']
                expl = self.post_process_explanation(expl)

                blob = TextBlob(expl)
                keywords = [x for x in blob.noun_phrases]

                # Using the keyword frequency to determine the most important keyword
                for key in keywords:
                    if not kw_freq.get(key):
                        kw_freq[key] = 0
                    kw_freq[key] += 1
            # Getting the most frequent keywords
            kw_freq_srt = sorted(kw_freq, key=kw_freq.get, reverse=True)
            # Picking the top TOP_N_SUBMISSIONS keywords as possible topics.
            m["possible_topics"] = kw_freq_srt[:TOP_N_SUBMISSIONS]
            filtered_keywords = []
            for k in m["possible_topics"]:
                f = 0
                for w in m["possible_topics"]:
                    if (k != w and k in w) or k in KEYWORDS_IGNORE:
                        f = 1
                        break
                if f == 0:
                    filtered_keywords.append(k)
            m["possible_topics"] = filtered_keywords

    def extract_metadesc_per_topic_keywords(self) -> None:
        '''
            Extract submissions per meta-descriptor for the possible topics and updated the lec_to_obj map to:
            lec_id : {
                'obj_idx': [id1, id2, ]
                'meta_descriptors': {
                    'descriptor_1': [id4, id7],
                    'descriptor_2': [id9], ..
                }
                'possible_topics': [topic1, topic2]
                'topics': [
                    {
                        'name': 'topic1',
                        'meta_descriptors': {
                            'descriptor_1': [], ...
                        }
                    }
                ]
            }

            Parameters:
                None.

            Returns:
                None.
        '''
        for lec, m in self.lec_to_obj.items():
            if m.get("possible_topics") is None or m.get("meta_descriptors") is None:
                continue
            topics = m["possible_topics"]
            lec_metadesc = m["meta_descriptors"]
            m["topics"] = []
            for topic in topics:
                topic_obj = {
                    "name": topic,
                    "meta_descriptors": {}
                }
                for desc_name, objid_lst in lec_metadesc.items():
                    df_expl = self.submission_df.iloc[objid_lst]
                    for i, row in df_expl.iterrows():
                        if topic.lower() in row["explanation"].lower():
                            if topic_obj["meta_descriptors"].get(desc_name):
                                topic_obj["meta_descriptors"][desc_name].append(json.loads(row.to_json()))
                            else:
                                topic_obj["meta_descriptors"][desc_name] = [json.loads(row.to_json())]
                m["topics"].append(topic_obj)

    def sequence(self) -> None:
        '''
        This method sorts the lectures based on their lec numbers in ascending order in the lec_to_obj map.

        Paramters:
            None.

        Returns:
            None.
        '''
        self.lec_to_obj = OrderedDict(
            sorted(self.lec_to_obj.items(), key=lambda kv: (float(kv[0]))))

    def create_node(self, id: str, type: str, title: str, path: str, leaf: str, module: str, parent: str, sub_list="null") -> Dict:
        """
        This method is used to create nodes for generating Topic Map

        Parameters:
            id (str): ID
            type (str): Type of the node
            title (str): Title of the node
            path (str): Path to the current node
            leaf (str): Current node title
            module (str): Topic name
            parent (str): Parent of the current node
            sub_list (List[Dict]): List of Submission nodes

        Returns:
            Dict of current node.
        """
        return {
            "id": id,
            "type": type,
            "title": title,
            "path": path,
            "leaf": leaf,
            "module": module,
            "parent": parent,
            "sub_list": sub_list
        }

    def create_link(self, source: str, target: str, target_node: Dict) -> Dict:
        """
        This method creates links for generating TopicMap

        Parameters:
            source (str): Parent node path
            target (str): Path of current node
            target_node (Dict): Dict of current node

        Returns:
            Dict of Link.
        """
        return {
            "source": source,
            "target": target,
            "targetNode": target_node
        }

    def generate_graph_data(self) -> Dict:
        '''
        This method transforms the lec to obj map data into the a structure thats consumable by the front-end api

        nodes: [
            {
                id: "6412242ba16775cc9de298c6",
                type: "lecture",
                title: "1.1",
                path: "1.1",
                leaf: "1.1",
                module: null,
                parent: "",
            },
        ],
        links: [
            {
            source: "1.1",
            target: "1.1/Text Mining",
            targetNode: {
                id: "6400479525bd2feef310aaa8",
                type: "topic",
                title: "Text Mining",
                path: "1.1/Text Mining",
                leaf: "Text Mining",
                module: "Text Mining",
                parent: "1.1",
            },
        ]

        Paramters:
            None.

        Returns:
            Dict(graphData): Contains nodes and links data
        '''
        nodes = []
        links = []

        root = self.community_name
        i = 0
        nodes.append(self.create_node(root, "root", root, root, root, "null", ""))
        for lec, m in self.lec_to_obj.items():
            if lec == "-1":
                lec = "Misc"
            else:
                lec = lec
            path = root + "/" + lec

            if len(m["topics"]) > 0:
                node = self.create_node(path, "lecture", lec, path, lec, "null", root)
                nodes.append(node)
                links.append(self.create_link(root, path, node))
            for topic in m["topics"]:
                parent = root + "/" + lec
                if len(topic["name"]) < 5:
                    topic["name"] = topic["name"].upper()
                else:
                    topic["name"] = topic["name"].title()
                path = root + "/" + lec + "/" + topic["name"]

                if len(topic["meta_descriptors"]) > 0:
                    node = self.create_node(path, "topic", topic["name"], path, topic["name"], topic["name"], parent)
                    nodes.append(node)
                    links.append(self.create_link(parent, path, node))
                for md_name, md_lst in topic["meta_descriptors"].items():
                    parent = root + "/" + lec + "/" + topic["name"]
                    path = root + "/" + lec + "/" + topic["name"] + "/" + md_name
                    node = self.create_node(path, "meta-descriptor", md_name, path, md_name, topic["name"], parent,
                                            md_lst)
                    nodes.append(node)
                    links.append(self.create_link(parent, path, node))
        graphData = {'nodes': nodes, 'links': links}
        return graphData
