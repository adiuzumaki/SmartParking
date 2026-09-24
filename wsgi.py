import sys
import os

# Add project path to sys.path
project_home = os.path.dirname(__file__)
if project_home not in sys.path:
    sys.path.append(project_home)

# Import app
from app import app as application
