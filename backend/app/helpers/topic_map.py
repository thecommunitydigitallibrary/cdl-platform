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
    KEYWORDS_IGNORE, TOP_N_HASHTAGS

class TopicMap:
    '''
        Class to read submissions JSON and create a Lecture to Topic Map.
    '''

    def __init__(self, *args) -> None:
        if len(args) == 0:
            raise Exception("Need to pass the json, root node name, community dict and levels list to the TopicMap()")

        self.data = None
        self.submission_df = pd.read_json(args[0])
        self.root_name = args[1]
        self.levels = args[2]
        self.ps = PorterStemmer()

        self.meta_desc = {}
        self.meta_desc_set = set()
        self.meta_desc_to_obj = {}

        self.rowid_map = {
            "metadescs": {},
            "topics": {},
            "hashtags": {},
            "communities": {},
            "ownSubmissions": {}
        }

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

        self.extract_all()

    def add_to_rowid_metadescs(self, rowid: str, metadesc_list: List[str]):
        '''
        This method added meta-descriptor list corresponding to the row.

        Parameters:
            rowid(str): Row ID in the dataframe.
            metadesc_list(List[str]): List of meta-descriptors corresponding to the current row(submission) explanation.
        Returns:
            None
        '''
        self.rowid_map["metadescs"][rowid] = metadesc_list

    def add_to_rowid_hastags(self, rowid: str, hastag_list):
        '''
        This method added hashtags list corresponding to the row.

        Parameters:
            rowid(str): Row ID in the dataframe.
            hastag_list(): List of hashtags corresponding to the current row(submission) explanation.
        Returns:
            None
        '''
        self.rowid_map["hashtags"][rowid] = hastag_list

    def add_to_rowid_topics(self, rowid: str, topic_list: List[str]):
        '''
        This method added hashtags list corresponding to the row.

        Parameters:
            rowid(str): Row ID in the dataframe.
            topic_list(List[str]): List of topics corresponding to the current row(submission) explanation.
        Returns:
            None
        '''
        self.rowid_map["topics"][rowid] = topic_list

    def add_to_rowid_communities(self, rowid: str, community_list: List[str]):
        '''
        This method added communities list corresponding to the row.

        Parameters:
            rowid(str): Row ID in the dataframe.
            community_list(List[str]): List of community corresponding to the current row(submission) explanation.
        Returns:
            None
        '''
        self.rowid_map["communities"][rowid] = community_list

    def add_to_rowid_ownSubmissions(self, rowid: str, own_sub_list: List[str]):
        '''
                This method added communities list corresponding to the row.

                Parameters:
                    rowid(str): Row ID in the dataframe.
                    own_sub_list(List[str]): Indicates if the submission is current user's submission or not.
                Returns:
                    None
                '''
        self.rowid_map["ownSubmissions"][rowid] = own_sub_list

    def extract_all(self):
        '''
        Extract meta-descriptors, hashtags, topics and communities from each submission.

        Parameters:
            None.
        Return:
            None.
        '''
        for idx, row in self.submission_df.iterrows():
            expl = row['explanation']
            hgh_txt = row["highlighted_text"]

            # For meta-descriptor extaction
            meta_descriptors = self.get_meta_descriptor(expl)

            # For hashtag extraction
            tags = row['hashtags']
            # Add hashtags
            if tags:
                if len(tags) > 0:
                    self.add_to_rowid_hastags(idx, tags)
                else:
                    self.add_to_rowid_hastags(idx, ["-1"])
            else:
                self.add_to_rowid_hastags(idx, ["-1"])

            # Add metadesc
            self.add_to_rowid_metadescs(idx, meta_descriptors)

            # For topic extraction
            expl = self.post_process_explanation(expl)

            blob = TextBlob(expl)
            keywords = [x for x in blob.noun_phrases]
            kw_freq = {}

            # Using the keyword frequency to determine the most frequent topics
            for key in keywords:
                if not kw_freq.get(key):
                    kw_freq[key] = 0
                kw_freq[key] += 1
            # Getting the most frequent keywords
            kw_freq_srt = sorted(kw_freq, key=kw_freq.get, reverse=True)
            possible_topics = kw_freq_srt[:TOP_N_SUBMISSIONS]
            filtered_keywords = []
            for k in possible_topics:
                f = 0
                for w in possible_topics:
                    if (k != w and k in w) or k in KEYWORDS_IGNORE:
                        f = 1
                        break
                if f == 0:
                    filtered_keywords.append(k)
            self.add_to_rowid_topics(idx, filtered_keywords)

            # For community extraction
            comm_list = []
            if row.get("communities_part_of"):
                for k, v in row['communities_part_of'].items():
                    comm_list.append(v)
            else:
                comm_list.append("Webpages")
            self.add_to_rowid_communities(idx, comm_list)

            # For own submission extraction
            own_sub_list = []
            if row.get("own_page"):
                if row["own_page"] == 1.0:
                    own_sub_list.append("Your Submissions")
                else:
                    own_sub_list.append("Other Submissions")
            else:
                own_sub_list.append("Other Submissions")
            self.add_to_rowid_ownSubmissions(idx, own_sub_list)

    def get_meta_descriptor(self, s: str) -> List[str]:
        '''
        This method is used to get the matching meta descriptors from an explanation by stemming each token in the string.

        Parameters:
            s (str): Explanation.

        Returns:
            list(str): List of meta descriptors found.
        '''
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

    def sequence(self, m) -> None:
        '''
        This method sorts based on the len of obj_list of map m in ascending order.

        Paramters:
            m (dict): Dict of a level (topics, hashtags, metadescs or communities).

        Returns:
            new_m(dict): Sorted Dict of a level (topics, hashtags, metadescs or communities)
        '''
        new_m = OrderedDict(
            sorted(m.items(), key=lambda kv: -len(kv[1]['obj_list']))[:TOP_N_HASHTAGS])
        return new_m

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

    def generate_map(self, idx, objid_list=None):
        '''
        This method generates the dict which follows the hierarchy in levels.

        Parameters:
            idx (int): Index of row in submissions dataframe.
            objid_list(List(int)): List of indices from the dataframe.

        Returns:
            m(Dict): Dict containing type, obj_list and it's children.
        '''
        if objid_list is None:
            objid_list = [i for i in range(len(self.submission_df))]

        if idx == len(self.levels):
            l = []
            df = self.submission_df.iloc[list(objid_list)]
            for i, row in df.iterrows():
                l.append(json.loads(row.to_json()))
            return l

        m = {}
        for i in objid_list:
            for l in self.rowid_map[self.levels[idx]][i]:
                if m.get(l):
                    m[l]["obj_list"].add(i)
                else:
                    s = set()
                    s.add(i)
                    m[l] = {
                        "type": self.levels[idx],
                        "obj_list": s
                    }
        m = self.sequence(m)
        # Get children
        for k, v in m.items():
            m[k]["children"] = self.generate_map(idx + 1, v["obj_list"])

        return m

    def generate_graph(self, m, idx, parent, nodes, links):
        '''
        This method generates graph which follows the hierarchy in levels.

        Parameters:
            m(Dict): The dict use to create nodes and links in the current level idx.
            idx(int): The index of level in the self.levels list.
            parent(str): The parent title.
            nodes(List[obj]): List of nodes in the graph to be visualized.
            links(List[obj]): List of links in the graph to be visualized.

        Returns:
            None.
        '''
        if idx == len(self.levels):
            return

        for k, v in m.items():
            curr_type = v['type']
            if v['type'] == 'hashtags' and k == '-1':
                k = 'Misc'

            module = k
            if idx == 0:
                module = "null"

            path = parent + "/" + k
            if idx == len(self.levels) - 1:
                node = self.create_node(
                    path, curr_type, k, path, k, module, parent, v['children'])
            else:
                node = self.create_node(
                    path, curr_type, k, path, k, module, parent)
            nodes.append(node)
            links.append(self.create_link(parent, path, node))

            self.generate_graph(v['children'], idx + 1, path, nodes, links)

    def generate_graph_json(self, m):
        '''
        This method generates nodes and links which will be used for visualization.

        Parameters:
            m(dict): Dict that holds the hierarchy info.

        Return:
            graph(dict): Contains nodes and links dict.
        '''

        nodes = []
        links = []
        nodes.append(self.create_node(
            self.root_name, "root", self.root_name, self.root_name, self.root_name, "null", ""))
        self.generate_graph(m, 0, self.root_name, nodes, links)

        graph = {"nodes": nodes, "links": links}
        return graph
