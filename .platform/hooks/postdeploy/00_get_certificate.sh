#!/usr/bin/env bash
# Place in .platform/hooks/postdeploy directory
sudo certbot -n -d http://ecom-test-env.eba-pkmdpeqm.us-east-1.elasticbeanstalk.com/ --nginx --agree-tos --email u3260593@uni.canberra.edu.au/