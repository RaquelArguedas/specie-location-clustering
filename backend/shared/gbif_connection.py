import pandas as pd
from pygbif import occurrences
import pandas as pd
import concurrent.futures
import time

def fetch_data_range(offset, batch_size=300, total_occurrences=10200):
    df_list = []
    print(f'Fetching data starting from offset {offset}')
    
    for i in range(offset, offset + total_occurrences, batch_size):
        print(f"{i} out of {offset + total_occurrences}")
        try:
            res = occurrences.search(offset=i, hasCoordinate=True, continent="EUROPE", kingdomKey=1, classKey=212, mediatype='StillImage')
            temp_df = pd.DataFrame(res['results'])
            if temp_df.empty:
                print(f"No more results at offset {i}, stopping.")
                break
            df_list.append(temp_df)
        except Exception as e:
            print(f"Error fetching data at offset {i}: {e}. Retrying...")
            time.sleep(5)  # Esperar antes de reintentar
    
    return pd.concat(df_list, ignore_index=True) if df_list else pd.DataFrame()

# use total_occurrences=10200, num_threads=1, batch_size=300 for testing with changes on the query
# ACTUAL PARAMETERS: takes around 17min to get the dataset done, aprox.150 species 
def get_datasets(total_occurrences=142800, num_threads=14, batch_size=300):
    df = pd.DataFrame()
    total_per_thread = total_occurrences // num_threads
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=num_threads) as executor:
        futures = [
            executor.submit(fetch_data_range, thread_id * total_per_thread, batch_size, total_per_thread)
            for thread_id in range(num_threads)
        ]
        
        for future in concurrent.futures.as_completed(futures):
            try:
                df = pd.concat([df, future.result()], ignore_index=True)
            except Exception as e:
                print(f"Error in thread: {e}")
    
    return df