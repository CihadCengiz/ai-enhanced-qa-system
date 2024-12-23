import sys
import json
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.decomposition import LatentDirichletAllocation
from pinecone import Pinecone

pc = Pinecone(api_key="YOUR_API_KEY")

def perform_topic_modelling(text, n_topics=3):
    vectorizer = CountVectorizer(stop_words="english", max_features=1000)
    text_matrix = vectorizer.fit_transform([text])
    lda = LatentDirichletAllocation(n_components=n_topics, random_state=42)
    lda.fit(text_matrix)
    
    topics = []
    for topic_idx, topic in enumerate(lda.components_):
        top_words = [vectorizer.get_feature_names_out()[i] for i in topic.argsort()[:-6:-1]]
        topics.append({'topic': topic_idx, 'words': top_words})
    return topics

def update_pinecone_metadata(index_name, vector_id, topics):
    """Update Pinecone metadata with topics."""
    # Specify the host (Pinecone environment or region)
    index = pc.Index(index_name)

    # Update the metadata
    metadata = {"topics": ", ".join([", ".join(topic['words']) for topic in topics])}
    index.update(id=vector_id, set_metadata=metadata)
    print(f"Metadata for vector {vector_id} in index {index_name} updated successfully!")

if __name__ == "__main__":
    # Komut satırından alınan argümanlar
    index_name = sys.argv[1]  # Pinecone index adı
    vector_id = sys.argv[2] 

    # stdin'den chunkedData JSON olarak alınıyor
    input_data = sys.argv[2]


    # Topic Modelling işlemini yap
    topics = perform_topic_modelling(input_data)
    
    # Sonuçları birleştir
    update_pinecone_metadata(index_name, input_data, topics)

    # Sonuçları JSON olarak yazdır
    print(json.dumps({"topics": topics}))
