"""Production server entry point, also usable locally."""
import os
from waitress import serve
from app import app
if __name__=='__main__':
    host=os.environ.get('HOST','127.0.0.1')
    port=int(os.environ.get('PORT','3000'))
    print(f'CrownMind v024 listening on {host}:{port}',flush=True)
    serve(app,host=host,port=port,threads=4,connection_limit=100,
          channel_timeout=30,max_request_header_size=8192,max_request_body_size=1024)
