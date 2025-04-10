SRC = ./src
BIN = ${SRC}/bin
LIB = ${SRC}/lib
DYNAMO_DATA = ${LIB}/storage/dynamo-stack/scripts

CMD = cd ${SRC} && cdk

run_all:
	${CMD} deploy --all

run:
	${CMD} deploy $(filter-out $@,$(MAKECMDGOALS))

destroy_all:
	${CMD} destroy --all

destroy:
	${CMD} destroy $(filter-out $@,$(MAKECMDGOALS))

seed_dynamo:
	cd ${DYNAMO_DATA} && npx ts-node seed-dynamo.ts $(filter-out $@,$(MAKECMDGOALS))

%:
	@:

