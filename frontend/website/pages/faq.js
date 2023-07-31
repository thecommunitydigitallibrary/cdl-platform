import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Link from "@mui/material/Link";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";




import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

export default function FrequentlyAskedQuestions() {
  return (
    <div
      style={{
        padding: "10px 20px 5px 20px",
        // removed hard set width
        display: "flex",
        flexDirection: "column",
        margin: "auto",
      }}
    >
      <h1 style={{ margin: "10px 0px 20px 0px" }}>
        Frequently Asked Questions{" "}
      </h1>
      <div className="AllResults">
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ fontWeight: "bold", fontSize: "18px" }}>
              {" "}
              How can I report a bug, give a suggestion, or discuss a concern?
            </Typography>
          </AccordionSummary>
          <Divider />
          <AccordionDetails>
            Please email Kevin Ros at{" "}
            <Link href={`mailto: kjros2@illinois.edu`} target="_blank">
              kjros2@illinois.edu
            </Link>
          </AccordionDetails>
        </Accordion>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ fontWeight: "bold", fontSize: "18px" }}>
              {" "}
              What should I do if the highlight doesn’t register?
            </Typography>
          </AccordionSummary>
          <Divider />
          <AccordionDetails>
            For some pages, your highlighted text will not be captured by the
            extension. You can tell that this is the case when the “Highlighted
            text:” area doesn’t display any text. If you want to save the
            highlighted text in the context or ask a question about the
            highlighted text, then first copy-paste it into the field right
            below the highlighted text display.{" "}
          </AccordionDetails>
        </Accordion>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ fontWeight: "bold", fontSize: "18px" }}>
              {" "}
              How can I submit a specific PDF page?
            </Typography>
          </AccordionSummary>
          <Divider />
          <AccordionDetails>
            You can add a fragment in the URL. For example, if you would like to
            submit page 9 of{" "}
            <Link
              href="https://arxiv.org/pdf/2007.00808.pdf?utm_source=findwork.dev&ref=findwork.dev&utm_medium=jobposting"
              target="_blank"
            >
              this PDF
            </Link>
            , you can add “#page=9” to the end of the URL in the address bar. That results in{" "}
            <Link
              href="https://arxiv.org/pdf/2007.00808.pdf?utm_source=findwork.dev&ref=findwork.dev&utm_medium=jobposting#page=9"
              target="_blank"
            >
              this link
            </Link>
            . Once you do this, you can open the extension, and it will pull the URL with the fragment for a submission.
          </AccordionDetails>
        </Accordion>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ fontWeight: "bold", fontSize: "18px" }}>
              {" "}
              What should I do for specific YouTube video times?
            </Typography>
          </AccordionSummary>
          <Divider />
          <AccordionDetails>
            If you want to make a submission at a specific time, you can change
            the webpage URL to include the video time (right click video → copy
            URL at current time → paste into address bar). Once you do this, you can open the extension, 
            and it will pull the URL with the fragment for a submission.
          </AccordionDetails>
        </Accordion>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ fontWeight: "bold", fontSize: "18px" }}>
              {" "}
              What should I do for Coursera videos?
            </Typography>
          </AccordionSummary>
          <Divider />
          <AccordionDetails>
            You can highlight the transcript and open the extension, and it
            should register the highlighted text.
          </AccordionDetails>
        </Accordion>
      </div>
    </div>
  );
}
