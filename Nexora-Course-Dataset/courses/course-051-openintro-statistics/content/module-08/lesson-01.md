# Fitting A Line By Least Squares Regression

> Source: OpenIntro Statistics. OpenIntro.
> Official URL: https://www.openintro.org/book/os/
> License: CC BY-SA 3.0
> Reused without endorsement. Original copyright notices retained.

Units of regression Consider a regression 
predicting weight (kg) from height (cm) for a sample of adult males. 
What are the units of the correlation coefficient, the intercept, 
and the slope?

Which is higher Determine if I or II 
is higher or if they are equal. Explain your reasoning.
 For a regression line, the uncertainty associated with the 
slope estimate, $b_1$, is higher when

- [I.] there is a lot of scatter around the regression line or
- [II.] there is very little scatter around the regression line

Over-under, Part I Suppose we fit a 
regression line to predict the shelf life of an apple based on its weight. 
For a particular apple, we predict the shelf life to be 4.6 days. The 
apple's residual is -0.6 days. Did we over or under estimate the 
shelf-life of the apple? Explain your reasoning.

Over-under, Part II Suppose we fit a 
regression line to predict the number of incidents of skin cancer per 
1,000 people from the number of sunny days in a year. For a particular 
year, we predict the incidence of skin cancer to be 1.5 per 1,000 people, 
and the residual for this year is 0.5. Did we over or under estimate 
the incidence of skin cancer? Explain your reasoning.

Tourism spending The Association of 
Turkish Travel Agencies reports the number of foreign tourists 
visiting Turkey and tourist spending by year.
 Three plots are provided: 
scatterplot showing the relationship between these two variables 
along with the least squares fit, residuals plot, and histogram of 
residuals.
center
0.32ch_regr_simple_linear/figures/eoce/tourism_spending_reg_conds/tourism_spending_count
0.32ch_regr_simple_linear/figures/eoce/tourism_spending_reg_conds/tourism_spending_count_residuals
0.32ch_regr_simple_linear/figures/eoce/tourism_spending_reg_conds/tourism_spending_count_residuals_hist
center
parts
- Describe the relationship between number of tourists and spending.
- What are the explanatory and response variables?
- Why might we want to fit a regression line to these data?
- Do the data meet the conditions required for fitting a least squares 
line? In addition to the scatterplot, use the residual plot and histogram 
to answer this question. 
parts

Nutrition at Starbucks, Part I 
The scatterplot below shows the relationship between the number of 
calories and amount of carbohydrates (in grams) Starbucks food menu 
items contain. Since Starbucks only 
lists the number of calories on the display items, we are interested 
in predicting the amount of carbs a menu item has based on its 
calorie content.
center
0.32ch_regr_simple_linear/figures/eoce/starbucks_cals_carbos/starbucks_cals_carbos
0.32ch_regr_simple_linear/figures/eoce/starbucks_cals_carbos/starbucks_cals_carbos_residuals
0.32ch_regr_simple_linear/figures/eoce/starbucks_cals_carbos/starbucks_cals_carbos_residuals_hist
center
parts
- Describe the relationship between number of calories and amount 
of carbohydrates (in grams) that Starbucks food menu items contain.
- In this scenario, what are the explanatory and response 
variables?
- Why might we want to fit a regression line to these data?
- Do these data meet the conditions required for fitting a least 
squares line?
parts

The Coast Starlight, Part II
Exercise~ introduces data on the Coast Starlight 
Amtrak train that runs from Seattle to Los Angeles. The mean travel 
time from one stop to the next on the Coast Starlight is 129 mins, 
with a standard deviation of 113 minutes. The mean distance traveled 
from one stop to the next is 108 miles with a standard deviation of 
99 miles. The correlation between travel time and distance is 0.636.
parts
- Write the equation of the regression line for predicting travel 
time.
- Interpret the slope and the intercept in this context.
- Calculate $R^2$ of the regression line for predicting travel 
time from distance traveled for the Coast Starlight, and interpret 
$R^2$ in the context of the application.
- The distance between Santa Barbara and Los Angeles is 103 
miles. Use the model to estimate the time it takes for the Starlight 
to travel between these two cities.
- It actually takes the Coast Starlight about 168 mins to travel 
from Santa Barbara to Los Angeles. Calculate the residual and explain 
the meaning of this residual value.
- Suppose Amtrak is considering adding a stop to the Coast 
Starlight 500 miles away from Los Angeles. Would it be appropriate to 
use this linear model to predict the travel time from Los Angeles to 
this point? 
parts

Body measurements, Part III
Exercise~ introduces 
data on shoulder girth and height of a group of individuals. The 
mean shoulder girth is 107.20 cm with a standard deviation of 
10.37 cm. The mean height is 171.14 cm with a standard deviation 
of 9.41 cm. The correlation between height and shoulder girth is 0.67.
parts
- Write the equation of the regression line for predicting height.
- Interpret the slope and the intercept in this context.
- Calculate $R^2$ of the regression line for predicting height 
from shoulder girth, and interpret it in the context of the 
application.
- A randomly selected student from your class has a shoulder 
girth of 100 cm. Predict the height of this student using the model.
- The student from part~(d) is 160 cm tall. Calculate the 
residual, and explain what this residual means.
- A one year old has a shoulder girth of 56 cm. Would it be 
appropriate to use this linear model to predict the height of this 
child?
parts

Murders and poverty, Part I The following 
regression output is for predicting annual murders per million from 
percentage living in poverty in a random sample of 20 metropolitan 
areas.\\[2mm]
minipage[c]0.54

tabularrrrrr
    
            & Estimate  & Std. Error    & t value   & Pr($>$$|$t$|$) \\ 
    
(Intercept) & -29.901   & 7.789         & -3.839    & 0.001 \\ 
poverty\
   
tabular \\
$s = 5.512  R^2 = 70.52\

parts
- Write out the linear model.
- Interpret the intercept.
- Interpret the slope.
- Interpret $R^2$.
- Calculate the correlation coefficient.
parts
minipage
minipage[c]0.02
$\:$\\
minipage
minipage[c]0.41
[A scatterplot is shown with 20 points. The horizontal axis is "Percent in Poverty" and has values ranging from 14\
minipage

Cats, Part I The following regression output is 
for predicting the heart weight (in g) of cats from their body weight 
(in kg). The coefficients are estimated using a dataset of 144 
domestic cats.\\[2mm]
minipage[c]0.54

tabularrrrrr
    
            & Estimate  & Std. Error    & t value   & Pr($>$$|$t$|$) \\ 
    
(Intercept) & -0.357    & 0.692         & -0.515    & 0.607 \\ 
body wt     & 4.034     & 0.250         & 16.119    & 0.000 \\ 
    
tabular \\
$s = 1.452  R^2 = 64.66\

parts
- Write out the linear model.
- Interpret the intercept.
- Interpret the slope.
- Interpret $R^2$.
- Calculate the correlation coefficient.
parts
minipage
minipage[c]0.02
$\:$\\
minipage
minipage[c]0.41
[A scatterplot is shown with about 150 points. The horizontal axis is "Body weight, in kilograms" and has values ranging from 2 to 4. The vertical axis is "Heart weight, in grams" with values ranging from about 5 to 20. About 25\
minipage

