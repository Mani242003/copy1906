import chromadb

client = chromadb.Client()
collection = client.create_collection("logs")

def store_logs(log):
    collection.add(documents=[log], ids=["1"])

def query_logs(q):
    return collection.query(query_texts=[q], n_results=2)['documents']