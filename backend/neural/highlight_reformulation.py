import torch.nn as nn
from transformers import BartTokenizer, BartForConditionalGeneration
import torch

class HR_model(nn.Module):
    def __init__(self, model_path):
        super().__init__()

        base_model = "facebook/bart-base"

        model_state_dict = torch.load(model_path, map_location=torch.device('cpu'))["state_dict"]
        new_state_dict = {}
        for x in model_state_dict:
            y = x[12:]
            new_state_dict[y] = model_state_dict[x]

        self.model = BartForConditionalGeneration.from_pretrained(base_model)
        self.model.load_state_dict(new_state_dict)

        self.tokenizer = BartTokenizer.from_pretrained(base_model)

    
    def forward(self, source_text_batch, target_text_batch, device):
        tokenized_source_batch = self.tokenizer(source_text_batch, padding=True, return_tensors="pt")
        tokenized_target_batch = self.tokenizer(target_text_batch, padding=True, return_tensors="pt")

        input_ids = tokenized_source_batch["input_ids"].to(device)
        input_attn_mask = tokenized_source_batch["attention_mask"].to(device)

    

        target_ids = tokenized_target_batch["input_ids"].to(device)


        output = self.model(
            input_ids=input_ids,
            attention_mask=input_attn_mask,
            labels=target_ids
        )


        return output.loss
    
    def generate(self, source_text_batch, device="cpu"):
        tokenized_source_batch = self.tokenizer(source_text_batch, padding=True, return_tensors="pt")

        input_ids = tokenized_source_batch["input_ids"].to(device)


        summary_ids = self.model.generate(input_ids,
                                            max_length=20,
                                            num_beams=5,
                                            num_return_sequences=5,
                                            no_repeat_ngram_size=2,
                                            early_stopping=True,
                                            num_beam_groups=5,
                                            diversity_penalty=0.99)
 
            
        return self.tokenizer.batch_decode(summary_ids, skip_special_tokens=True, clean_up_tokenization_spaces=True)