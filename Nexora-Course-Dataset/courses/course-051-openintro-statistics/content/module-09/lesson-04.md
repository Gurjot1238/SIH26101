# Model Selection

> Source: OpenIntro Statistics. OpenIntro.
> Official URL: https://www.openintro.org/book/os/
> License: CC BY-SA 3.0
> Reused without endorsement. Original copyright notices retained.

Baby weights, Part IV 
Exercise~ considers a model that predicts a newborn's 
weight using several predictors (gestation length, parity, age of mother, height 
of mother, weight of mother, smoking status of mother). The table below shows 
the adjusted R-squared for the full model as well as adjusted R-squared values 
for all models we evaluate in the first step of the backwards elimination 
process. 
center
tabularrlr
  
  & Model               & Adjusted $R^2$ \\ 
  
1 & Full model          & 0.2541 \\ 
2 & No gestation        & 0.1031 \\ 
3 & No parity           & 0.2492 \\ 
4 & No age              & 0.2547 \\ 
5 & No height           & 0.2311 \\ 
6 & No weight           & 0.2536 \\ 
7 & No smoking status   & 0.2072 \\ 
  
tabular
center
Which, if any, variable should be removed from the model first?

Absenteeism, Part II 
Exercise~ considers a model that predicts the number 
of days absent using three predictors: ethnic background (eth), 
gender (sex), and learner status (lrn). The table below shows the 
adjusted R-squared for the model as well as adjusted R-squared values for all 
models we evaluate in the first step of the backwards elimination process. 
center
tabularrlr
  
  & Model               & Adjusted $R^2$ \\ 
  
1 & Full model          & 0.0701 \\ 
2 & No ethnicity        & -0.0033 \\ 
3 & No sex              & 0.0676 \\ 
4 & No learner status   & 0.0723 \\ 
  
tabular
center
Which, if any, variable should be removed from the model first?

Baby weights, Part V 
Exercise~ provides regression output for the full 
model (including all explanatory variables available in the data set) for 
predicting birth weight of babies. In this exercise we consider a
forward-selection algorithm and add variables to the model
one-at-a-time. The table 
below shows the p-value and adjusted $R^2$ of each model where we include only 
the corresponding predictor. Based on this table, which variable should be added 
to the model first?0.5mm
center
tabularl c c c c c c

variable    & gestation	            & parity  & age	    
                & height          
                    & weight              
                        & smoke \\

p-value	    & $2.2  10^-16$	& 0.1052	& 0.2375	
                & $2.97  10^-12$
                    & $8.2  10^-8$
                        & $2.2  10^-16$ \\
$R_adj^2$	& 0.1657				        & 0.0013	& 0.0003	
                & 0.0386				
                    & 0.0229				
                        & 0.0569 \\

tabular
center

Absenteeism, Part III 
Exercise~ provides regression output for the full 
model, including all explanatory variables available in the data set, for 
predicting the number of days absent from school. In this exercise we consider a 
forward-selection algorithm and add variables to the model one-at-a-time. The 
table below shows the p-value and adjusted $R^2$ of each model where we include 
only the corresponding predictor. Based on this table, which variable should be 
added to the model first?0.5mm
center
tabularl c c c
  
variable    & ethnicity  & sex	   & learner status	 \\
  
p-value		& 0.0007     & 0.3142  & 0.5870	 \\
$R_adj^2$	& 0.0714     & 0.0001  & 0 \\
  
tabular
center

Movie lovers, Part I Suppose a social 
scientist is interested in studying what makes audiences love or hate a movie. 
She collects a random sample of movies (genre, length, cast, director, budget, 
etc.) as well as a measure of the success of the movie (score on a film review 
aggregator website). If as part of her research she is interested in finding out
which variables are significant predictors of movie success, what type of model 
selection method should she use?

Movie lovers, Part II Suppose an online 
media streaming company is interested in building a movie recommendation system. 
The website maintains data on the movies in their database (genre, length, cast, 
director, budget, etc.) and additionally collects data from their subscribers (
demographic information, previously watched movies, how they rated previously 
watched movies, etc.). The recommendation system will be deemed successful if 
subscribers actually watch, and rate highly, the movies recommended to them. 
Should the company use the adjusted $R^2$ or the p-value approach in selecting
variables for their recommendation system?

