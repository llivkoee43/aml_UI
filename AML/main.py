import numpy as np
import pandas as pd
from flask import Flask,request
from flask_cors import CORS
from flask import jsonify

app=Flask(__name__)
CORS(app)
AML_table=pd.read_csv("txn_records_0426.csv")
AML_accts=pd.read_csv("all_accts_list.csv", encoding='big5')


# try the following code in terminal
# curl -d '{"acct_nbr":"0000269FB06B6C4D57747751"}' -H "Content-Type: application/json" -X POST http://localhost:5000/table_filter

@app.route("/")
def hello():
    return "Hello World"

@app.route("/table_filter",methods=['GET'])
def Table_filter():
    
    
    '''
       filter out the L1 & L2 transactions of the selected account number
    '''
    acct_nbr=request.args.get('acct_nbr')
    threshold_L1=request.args.get('L1_threshold')
    threshold_L2=request.args.get('L2_threshold')
    print(acct_nbr)
    print(threshold_L1)
    print(threshold_L2)
    output_L1=AML_table[AML_table['acct_nbr']==acct_nbr] # L1 transactions
    output_L1 = output_L1[(output_L1['indegree_amt']>=float(threshold_L1)) | (output_L1['outdegree_amt']>=float(threshold_L1))]
    output_L1['level']='L1'
    Target_acct=output_L1[output_L1['acct_nbr']==acct_nbr]['txn_acct'].unique().tolist() # get L1 transactions account numbers
    output_L2=AML_table[AML_table['acct_nbr'].isin(Target_acct)]# L2 transactions
    output_L2 = output_L2[(output_L2['indegree_amt']>=float(threshold_L2)) | (output_L2['outdegree_amt']>=float(threshold_L2))]
    output_L2['level']='L2'
    links = pd.concat([output_L1, output_L2])
    output_links = links.to_json(orient="records", force_ascii=False)
    print(output_links)
    '''
       get all nodes and required informations
    '''      
    accts = links['acct_nbr'].unique().tolist()
    txn_accts = links['txn_acct'].unique().tolist()
    for i in txn_accts:
        if i not in accts:
            accts.append(i)
    nodes = AML_accts[AML_accts['acct_nbr'].isin(accts)]
    output_nodes = nodes.to_json(orient='records', force_ascii=False)
    
    
    final_answers = {
        "txn_records": output_links,
        "acct_list": output_nodes
    }
    
    print(final_answers)
    return jsonify(final_answers)


if __name__=="__main__":
    app.run(host="0.0.0.0")
