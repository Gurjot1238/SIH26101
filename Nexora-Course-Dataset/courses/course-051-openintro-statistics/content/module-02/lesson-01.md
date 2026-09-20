# Case Study Malaria Vaccine

> Source: OpenIntro Statistics. OpenIntro.
> Official URL: https://www.openintro.org/book/os/
> License: CC BY-SA 3.0
> Reused without endorsement. Original copyright notices retained.

Side effects of Avandia Rosiglitazone is the 
active ingredient in the controversial type~2 diabetes medicine Avandia and has 
been linked to an increased risk of serious cardiovascular problems such as 
stroke, heart failure, and death. A common alternative treatment is pioglitazone, 
the active ingredient in a diabetes medicine called Actos. In a nationwide 
retrospective observational study of 227,571 Medicare beneficiaries aged  
65 years or older, it was found that 2,593 of the 67,593 patients using 
rosiglitazone and 5,386 of the 159,978 using pioglitazone had serious 
cardiovascular problems. These data are summarized in the contingency 
table below. 
center
tabularll  cc c 
                                &   & 2c**Cardiovascular problems** \\
3-4 
                                    &               & Yes   & No        & Total \\
2-5
2***Treatment** & Rosiglitazone & 2,593 & 65,000    & 67,593 \\
                                    & Pioglitazone  & 5,386 & 154,592   & 159,978 \\
2-5
                                    & Total         & 7,979 & 219,592   & 227,571
tabular
center
parts
- Determine if each of the following statements is true or false. If false, explain why. **Be careful:** The reasoning may be wrong even if the statement's conclusion is correct. In such cases, the statement should be considered false.
subparts
- Since more patients on pioglitazone had cardiovascular problems (5,386 vs. 2,593), we can conclude that the rate of cardiovascular problems for those on a pioglitazone treatment is higher.
- The data suggest that diabetic patients who are taking rosiglitazone are more likely to have cardiovascular problems since the rate of incidence was (2,593 / 67,593 = 0.038) 3.8\
- The fact that the rate of incidence is higher for the rosiglitazone group proves that rosiglitazone causes serious cardiovascular problems.
- Based on the information provided so far, we cannot tell if the difference between the rates of incidences is due to a relationship between the two variables or due to chance.
subparts
- What proportion of all patients had cardiovascular problems?
- If the type of treatment and having cardiovascular problems were independent, about how many patients in the rosiglitazone group would we expect to have had cardiovascular problems?
- We can investigate the relationship between outcome and treatment in this study using a randomization technique.  While in reality we would carry out the simulations required for randomization using statistical software, suppose we actually simulate using index cards. In order to simulate from the independence model, which states that the outcomes were independent of the treatment, we write whether or not each patient had a cardiovascular problem on cards, shuffled all the cards together, then deal them into two groups of size 67,593 and 159,978. We repeat this simulation 1,000 times and each time record the number of people in the rosiglitazone group who had cardiovascular problems. Use the relative frequency histogram of these counts to answer (i)-(iii).
parts
minipage[c]0.5
subparts
- What are the claims being tested?
- Compared to the number calculated in part~(c), which would provide more support for the alternative hypothesis,  **more** or **fewer** patients with cardiovascular problems in the rosiglitazone group?
- What do the simulation results suggest about the relationship between taking rosiglitazone and having cardiovascular problems in diabetic patients?
subparts
minipage
minipage[c]0.5
eoce/randomization_avandiarandomization_avandia \\
minipage

Heart transplants The Stanford 
University Heart Transplant Study was conducted to determine whether an 
experimental heart transplant program increased lifespan. Each patient 
entering the program was designated an official heart transplant candidate, 
meaning that he was gravely ill and would most likely benefit from a new heart. 
Some patients got a transplant and some did not. The variable transplant 
indicates which group the patients were in; patients in the treatment group got a 
transplant and those in the control group did not. Of the 34 patients in the 
control group, 30 died. Of the 69 people in the treatment group, 45 died. Another 
variable called survived was used to indicate whether or not the patient 
was alive at the end of the study. 
center
0.48eoce/randomization_heart_transplantsrandomization_heart_transplants_box
center
parts
- Based on the mosaic plot, is survival independent of whether or not the 
patient got a transplant? Explain your reasoning.
- What do the box plots below suggest about the efficacy (effectiveness) of the heart transplant treatment.
- What proportion of patients in the treatment group and what proportion of 
patients in the control group died?
- One approach for investigating whether or not the treatment is effective 
is to use a randomization technique.
subparts
- What are the claims being tested?
- The paragraph below describes the set up for such approach, if we were 
to do it without using statistical software. Fill in the blanks with a number 
or phrase, whichever is appropriate.
adjustwidth2em2em
We write **alive** on 2cm0.5pt cards representing patients who were 
alive at the end of the study, and **dead** on 2cm0.5pt cards 
representing patients who were not. Then, we shuffle these cards and split them 
into two groups: one group of size 2cm0.5pt representing treatment, and 
another group of size 2cm0.5pt representing control. We calculate the 
difference between the proportion of **dead** cards in the treatment and 
control groups (treatment - control) and record this value. We repeat this 100 
times to build a distribution centered at 2cm0.5pt. Lastly, we calculate 
the fraction of simulations where the simulated differences in proportions are 
2cm0.5pt. If this fraction is low, we conclude that it is unlikely to 
have observed such an outcome by chance and that the null hypothesis should 
be rejected in favor of the alternative.
adjustwidth
- What do the simulation results shown below suggest about the effectiveness 
of the transplant program?
subparts
parts
center
0.6eoce/randomization_heart_transplantsrandomization_heart_transplants_rando
center

