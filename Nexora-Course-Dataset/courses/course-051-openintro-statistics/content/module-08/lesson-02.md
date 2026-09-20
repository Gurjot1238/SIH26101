# Inference For Linear Regression

> Source: OpenIntro Statistics. OpenIntro.
> Official URL: https://www.openintro.org/book/os/
> License: CC BY-SA 3.0
> Reused without endorsement. Original copyright notices retained.

In the following exercises, visually check the conditions
for fitting a least squares regression line.
However, you do not need to report these conditions in
your solutions.\\[6mm]

Body measurements, Part IV 
The scatterplot and least squares summary below show the relationship 
between weight measured in kilograms and height measured in centimeters 
of 507 physically active individuals.

[c]0.4
center
ch_regr_simple_linear/figures/eoce/body_measurements_weight_height_inf/body_measurements_weight_height
center
minipage
minipage[c]0.6

center
tabularrrrrr
    
            & Estimate  & Std. Error    & t value   & Pr($>$$|$t$|$) \\ 
    
(Intercept) & -105.0113 & 7.5394        & -13.93    & 0.0000 \\ 
height      & 1.0176    & 0.0440        & 23.13     & 0.0000 \\
    
tabular
center

minipage
parts
- Describe the relationship between height and weight.
- Write the equation of the regression line. Interpret the slope 
and intercept in context.
- Do the data provide strong evidence that an increase in height 
is associated with an increase in weight? State the null and alternative 
hypotheses, report the p-value, and state your conclusion.
- The correlation coefficient for height and weight is 0.72. 
Calculate $R^2$ and interpret it in context.
parts

Beer and blood alcohol content 
Many people believe that gender, 
weight, drinking habits, and many other factors are much more important 
in predicting blood alcohol content (BAC) than simply considering the 
number of drinks a person consumed. Here we examine data from sixteen 
student volunteers at Ohio State University who each drank a randomly 
assigned number of cans of beer. These students were evenly divided 
between men and women, and they differed in weight and drinking habits. 
Thirty minutes later, a police officer measured their blood alcohol 
content (BAC) in grams of alcohol per deciliter of blood.
 The scatterplot and regression 
table summarize the findings.

[c]0.4
center
ch_regr_simple_linear/figures/eoce/beer_blood_alcohol_inf/beer_blood_alcohol
center
minipage
minipage[c]0.6

center
tabularrrrrr
    
            & Estimate  & Std. Error    & t value   & Pr($>$$|$t$|$) \\ 
    
(Intercept) & -0.0127   & 0.0126        & -1.00     & 0.3320 \\ 
beers       & 0.0180    & 0.0024        & 7.48      & 0.0000 \\ 
    
tabular
center

minipage
parts
- Describe the relationship between the number of cans of beer 
and BAC.
- Write the equation of the regression line. Interpret the slope 
and intercept in context.
- Do the data provide strong evidence that drinking more cans of 
beer is associated with an increase in blood alcohol? State the null 
and alternative hypotheses, report the p-value, and state your 
conclusion.
- The correlation coefficient for number of cans of beer and BAC 
is 0.89. Calculate $R^2$ and interpret it in context.
- Suppose we visit a bar, ask people how many drinks they have had, 
and also take their BAC. Do you think the relationship between number 
of drinks and BAC would be as strong as the relationship found in the 
Ohio State study?
parts

Husbands and wives, Part II The 
scatterplot below summarizes husbands' and wives' heights in a random 
sample of 170 married couples in Britain, where both partners' ages are 
below 65 years. Summary output of the least squares fit for predicting 
wife's height from husband's height is also provided in the table.

[c]0.4
center
ch_regr_simple_linear/figures/eoce/husbands_wives_height_inf_2s/husbands_wives_height_inf_2s
center
minipage
minipage[c]0.6

center
tabularrrrrr
    
                    & Estimate  & Std. Error    & t value   & Pr($>$$|$t$|$) \\ 
    
(Intercept)         & 43.5755   & 4.6842        & 9.30      & 0.0000 \\ 
height\_0.3mmhusband   & 0.2863    & 0.0686        & 4.17      & 0.0000 \\ 
    
tabular
center

minipage
parts
- Is there strong evidence that taller men marry taller women? 
State the hypotheses and include any information used to conduct the test.
- Write the equation of the regression line for predicting wife's 
height from husband's height.
- Interpret the slope and intercept in the context of the application.
- Given that $R^2 = 0.09$, what is the correlation of heights 
in this data set?
- You meet a married man from Britain who is 5'9" (69 inches). 
What would you predict his wife's height to be? How reliable is this 
prediction?
- You meet another married man from Britain who is 6'7" (79 inches). 
Would it be wise to use the same linear model to predict his wife's 
height? Why or why not?
parts

Urban homeowners, Part II
Exercise~ gives a scatterplot displaying the 
relationship between the percent of families that own their home and 
the percent of the population living in urban areas. Below is a 
similar scatterplot, excluding District of Columbia, as well as the 
residuals plot. There were 51 cases.

[c]0.45

- For these data, $R^2=0.28$. What is the correlation? How can 
you tell if it is positive or negative?
- Examine the residual plot. What do you observe? Is a simple 
least squares fit appropriate for these data?
parts15mm
minipage
minipage[c]0.1
$\:$ \\
minipage
minipage[c]0.43
center
ch_regr_simple_linear/figures/eoce/urban_homeowners_cond/urban_homeowners_cond
center
minipage

Murders and poverty, Part II
Exercise~ presents regression output from a model 
for predicting annual murders per million from percentage living in 
poverty based on a random sample of 20 metropolitan areas. The model 
output is also provided below.
center
tabularrrrrr
    
            & Estimate  & Std. Error    & t value   & Pr($>$$|$t$|$) \\ 
    
(Intercept) & -29.901   & 7.789         & -3.839    & 0.001 \\ 
poverty\
    
tabular
\[ s = 5.512  R^2 = 70.52\
center
parts
- What are the hypotheses for evaluating whether poverty percentage 
is a significant predictor of murder rate?
- State the conclusion of the hypothesis test from part (a) in 
context of the data.
- Calculate a 95\
percentage, and interpret it in context of the data.
- Do your results from the hypothesis test and the confidence 
interval agree? Explain.
parts

Babies Is the gestational age 
(time between conception and birth) of a low birth-weight baby useful 
in predicting head circumference at birth? Twenty-five low birth-weight 
babies were studied at a Harvard teaching hospital; the investigators 
calculated the regression of head circumference (measured in centimeters) 
against gestational age (measured in weeks). The estimated regression 
line is
\[ head~circumference = 3.91 + 0.78  gestational~age \]
parts
- What is the predicted head circumference for a baby whose 
gestational age is 28 weeks?
- The standard error for the coefficient of gestational age is 0.
35, which is associated with $df=23$. Does the model provide strong 
evidence that gestational age is significantly associated with head 
circumference?
parts

