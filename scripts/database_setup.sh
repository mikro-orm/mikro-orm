echo "Creating MYSQL database."
MYSQL_CONTAINER_NAME=$(docker ps --format="{{.Names}}" | grep 'mysql')
if [[ -z "$MYSQL_CONTAINER_NAME" ]]; then
    echo "MySQL container not running. Please check the name of the container."
    exit
fi
docker exec $MYSQL_CONTAINER_NAME bash -c "mysql -u root -e 'CREATE DATABASE IF NOT EXISTS mikro_orm_test;'"
echo "Creating PostgreSQL database."
POSTGRES_CONTAINER_NAME=$(docker ps --format="{{.Names}}" | grep 'postgre')
if [[ -z "$POSTGRES_CONTAINER_NAME" ]]; then
    echo "POSTGRES container not running. Please check the name of the container."
    exit
fi
docker exec postgre bash -c "psql -c 'CREATE DATABASE mikro_orm_test;' -U postgres"
